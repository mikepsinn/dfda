import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { VertexAI } from '@google-cloud/vertexai'; // Import VertexAI for verification

// --- Configuration --- 
const PROJECT_ID = "healome-dev-358414"; // CONFIRM THIS IS YOUR CORRECT PROJECT ID
const SERVICE_ACCOUNT_NAME = "dfda-node-search-user"; // Name for the service account
const SERVICE_ACCOUNT_DISPLAY_NAME = "DFDA Node Vertex AI Search User";
const ROLE_DISCOVERY_ENGINE = "roles/discoveryengine.user"; // Role for converseConversation
const ROLE_AI_PLATFORM = "roles/aiplatform.user"; // Role for generateContent
const KEY_FILE_DIRECTORY = path.resolve(process.cwd()); // Save key in the project root
const KEY_FILE_NAME = `gcp-service-account-key.json`;
const KEY_FILE_PATH = path.join(KEY_FILE_DIRECTORY, KEY_FILE_NAME);
const VERIFICATION_MODEL_ID = 'gemini-1.0-pro-001'; // Use a simple model for verification
// --- End Configuration ---

const SERVICE_ACCOUNT_EMAIL = `${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com`;

// Helper function to run shell commands
function runCommand(command: string, ignoreErrorPattern?: RegExp): boolean {
  console.log(`
▶️ Executing: ${command}
`);
  try {
    const output = execSync(command, { stdio: 'pipe' }); // Use 'pipe' to capture output
    console.log(output.toString());
    console.log(`✅ Command executed successfully.`);
    return true;
  } catch (error: any) {
    const stderr = error.stderr?.toString() || "";
    const stdout = error.stdout?.toString() || ""; // Sometimes gcloud errors go to stdout
    const errorMessage = stderr || stdout;

    // Check if we should ignore this specific error
    if (ignoreErrorPattern && ignoreErrorPattern.test(errorMessage)) {
        console.warn(`⚠️ Command executed with expected non-fatal error: ${errorMessage.split('\n')[0]}`);
        console.warn(`   (Ignoring error based on pattern: ${ignoreErrorPattern})`);
        return true; // Treat as success for script continuation
    }

    // Handle as a real error
    console.error(`❌ Error executing command: ${command}`);
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }
    if (stdout && !stderr) { // Only show stdout if stderr is empty
        console.error(`Stdout: ${stdout}`);
    }
    if (!stderr && !stdout) {
        console.error(error);
    }
    return false;
  }
}

// --- Verification API Call Function ---
async function verifyApiCall(projectId: string, location: string, keyFilePath: string, modelId: string) {
  console.log("\n--- Attempting API Call Verification --- ");
  if (!fs.existsSync(keyFilePath)) {
    console.error(`❌ Verification Skipped: Key file not found at ${keyFilePath}`);
    return;
  }

  // Temporarily set environment variable to force use of the key file
  const originalCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
  console.log(`Temporarily set GOOGLE_APPLICATION_CREDENTIALS=${keyFilePath}`);

  try {
    // Instantiate VertexAI - it will now use the environment variable
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
      // No keyFilename needed here
    });

    const generativeModel = vertexAI.getGenerativeModel({ model: modelId });

    const testPrompt = "Say hi";
    console.log(`Attempting to call ${modelId} with prompt: "${testPrompt}" using key file...`);
    const result = await generativeModel.generateContent(testPrompt);
    const response = result.response;
    
    if (response?.candidates?.length && response.candidates[0].content?.parts?.length) {
       console.log(`✅ API Call Verification Success: Model responded.`);
       // console.log(`Response snippet: ${response.candidates[0].content.parts[0].text?.substring(0, 50)}...`);
    } else {
       console.warn('⚠️ API Call Verification Warning: Model responded but content structure was unexpected.', { response });
    }

  } catch (error: any) {
     console.error('❌ API Call Verification Failed:');
     // Log extracted details if possible (similar to action error handling)
     const nestedError = error.details ? { code: error.code, details: error.details, metadata: error.metadata } : error;
     console.error(`   Code: ${nestedError.code || 'N/A'}`);
     console.error(`   Details: ${nestedError.details || nestedError.message || 'No details available'}`);
     if (nestedError.message?.includes('aiplatform.endpoints.predict')) {
         console.error('   >>> This looks like the aiplatform.endpoints.predict permission issue.');
     }
     // console.error('Raw Error:', error); // Uncomment for full error object
  } finally {
      // Restore original environment variable value
      if (originalCredentials) {
          process.env.GOOGLE_APPLICATION_CREDENTIALS = originalCredentials;
          console.log(`Restored original GOOGLE_APPLICATION_CREDENTIALS.`);
      } else {
          delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
          console.log(`Unset temporary GOOGLE_APPLICATION_CREDENTIALS.`);
      }
  }
}

// Main setup function
async function setupGcp() {
  console.log("--- Starting GCP Setup for Vertex AI Search --- ");
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Service Account Name: ${SERVICE_ACCOUNT_NAME}`);
  console.log(`Key File Path: ${KEY_FILE_PATH}`);
  console.log("-----------------------------------------------");

  // 1. Set Active Project (Good practice, though might be set already)
  if (!runCommand(`gcloud config set project ${PROJECT_ID}`)) {
    console.error("Failed to set active project. Ensure you are authenticated and the project exists.");
    process.exit(1);
  }

  // 2. Enable Discovery Engine API
  console.log("\n--- Enabling Discovery Engine API ---");
  if (!runCommand(`gcloud services enable discoveryengine.googleapis.com --project=${PROJECT_ID}`)) {
    console.error("Failed to enable Discovery Engine API. Check permissions.");
    process.exit(1);
  }

  // 3. Create Service Account (Error if it already exists is ok)
  console.log("\n--- Creating Service Account ---");
  const alreadyExistsPattern = /already exists/i; // Regex to match the error
  if (!runCommand(`gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} --display-name="${SERVICE_ACCOUNT_DISPLAY_NAME}" --project=${PROJECT_ID}`, alreadyExistsPattern)) {
      // If runCommand returned false AND the error didn't match the pattern, it's a real error
      console.error("Failed to create service account due to an unexpected error.");
      process.exit(1);
  }
  // Add a delay regardless of whether it was created now or existed before
  console.log("Waiting 10 seconds for service account propagation...");
  await new Promise(resolve => setTimeout(resolve, 10000)); // Increased delay to 10 seconds

  // 4. Grant IAM Roles
  console.log("\n--- Granting IAM Roles ---");
  // Grant Discovery Engine User role
  if (!runCommand(`gcloud projects add-iam-policy-binding ${PROJECT_ID} --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" --role="${ROLE_DISCOVERY_ENGINE}"`)) {
    console.error(`Failed to grant role ${ROLE_DISCOVERY_ENGINE}. Check permissions and ensure service account exists.`);
    // Don't exit immediately, try granting the next role
  }
  // Grant AI Platform User role
  if (!runCommand(`gcloud projects add-iam-policy-binding ${PROJECT_ID} --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" --role="${ROLE_AI_PLATFORM}"`)) {
    console.error(`Failed to grant role ${ROLE_AI_PLATFORM}. Check permissions and ensure service account exists.`);
    process.exit(1); // Exit if the essential role for generateContent fails
  }
    // Add a small delay for IAM propagation
  await new Promise(resolve => setTimeout(resolve, 5000)); 

  // 5. Create and Download Service Account Key
  console.log("\n--- Creating Service Account Key ---");
   // Check if key file already exists to avoid creating unnecessary keys
   if (fs.existsSync(KEY_FILE_PATH)) {
     console.warn(`⚠️ Key file already exists at ${KEY_FILE_PATH}. Skipping key creation.`);
     console.warn(`   If you need a new key, delete the existing file first.`);
   } else {
     if (!runCommand(`gcloud iam service-accounts keys create ${KEY_FILE_PATH} --iam-account=${SERVICE_ACCOUNT_EMAIL} --project=${PROJECT_ID}`)) {
       console.error("Failed to create service account key.");
       process.exit(1);
     }
   }

  console.log("\n-----------------------------------------------");
  console.log("✅ GCP Setup Script Completed (Roles granted, Key exists/created).");
  console.log("-----------------------------------------------");
  console.log(`ℹ️ Service Account Email: ${SERVICE_ACCOUNT_EMAIL}`);
  console.log(`🔑 Service Account Key File: ${KEY_FILE_PATH}`);

  // --- Add Verification Steps ---
  console.log("\n--- Starting Verification Steps ---");

  // 6. Verify IAM Role Assignment
  console.log("\n--- Verifying IAM Roles ---");
  const roleCheckCommand = `gcloud projects get-iam-policy ${PROJECT_ID} --flatten="bindings[].members" --format="value(bindings.role)" --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT_EMAIL}"`;
  console.log(`Executing: ${roleCheckCommand}`);
  let discoveryRoleFound = false;
  let aiPlatformRoleFound = false;
  try {
    const roleOutput = execSync(roleCheckCommand, { encoding: 'utf-8' });
    console.log("Assigned roles:\n" + roleOutput);
    discoveryRoleFound = roleOutput.includes(ROLE_DISCOVERY_ENGINE);
    aiPlatformRoleFound = roleOutput.includes(ROLE_AI_PLATFORM);

    if (discoveryRoleFound) {
      console.log(`✅ Verification Success: Role '${ROLE_DISCOVERY_ENGINE}' is assigned.`);
    } else {
      console.warn(`⚠️ Verification Warning: Role '${ROLE_DISCOVERY_ENGINE}' *not found*. This might be needed if using Discovery Engine APIs directly.`);
    }
    if (aiPlatformRoleFound) {
      console.log(`✅ Verification Success: Role '${ROLE_AI_PLATFORM}' is assigned.`);
    } else {
      console.error(`❌ Verification Failed: Role '${ROLE_AI_PLATFORM}' *not found*. This is required for generateContent.`);
      // Optionally exit: process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ Error verifying IAM roles:`);
    if (error.stderr) console.error(`Stderr: ${error.stderr.toString()}`);
    if (error.stdout) console.error(`Stdout: ${error.stdout.toString()}`);
    if (!error.stderr && !error.stdout) console.error(error);
  }

  // 7. Verify API Enabled
  console.log("\n--- Verifying API Enabled ---");
  const apiCheckCommand = `gcloud services list --enabled --filter="name:discoveryengine.googleapis.com" --format="value(config.name)" --project=${PROJECT_ID}`;
  console.log(`Executing: ${apiCheckCommand}`);
  try {
    const apiOutput = execSync(apiCheckCommand, { encoding: 'utf-8' }).trim();
    console.log(`Output: ${apiOutput || '(No output)'}`);
    if (apiOutput === 'discoveryengine.googleapis.com') {
      console.log('✅ Verification Success: Discovery Engine API is enabled.');
    } else {
      console.error('❌ Verification Failed: Discovery Engine API does *not* appear to be enabled.');
    }
  } catch (error: any) {
    console.error(`❌ Error verifying enabled API:`);
    if (error.stderr) console.error(`Stderr: ${error.stderr.toString()}`);
    if (error.stdout) console.error(`Stdout: ${error.stdout.toString()}`);
    if (!error.stderr && !error.stdout) console.error(error);
  }

  // --- End Verification Steps ---

  // 8. Run API Call Verification
  await verifyApiCall(PROJECT_ID, 'us-central1', KEY_FILE_PATH, VERIFICATION_MODEL_ID);

  console.log("\n⚠️ IMPORTANT: ⚠️");
  console.log("1. Secure the generated key file (${KEY_FILE_NAME}). DO NOT commit it to Git.");
  console.log("2. For Vercel deployment, copy the ENTIRE content of the key file.");
  console.log("3. Add it as an environment variable named GOOGLE_APPLICATION_CREDENTIALS in your Vercel project settings.");
  console.log("4. Also ensure GOOGLE_CLOUD_PROJECT_ID is set correctly in Vercel.");
  console.log("5. For local development using ADC, this key file is usually not needed if you ran 'gcloud auth application-default login'.");
}

// Run the setup
setupGcp(); 