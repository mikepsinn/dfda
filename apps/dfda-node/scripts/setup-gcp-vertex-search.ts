import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// --- Configuration --- 
const PROJECT_ID = "healome-dev-358414"; // CONFIRM THIS IS YOUR CORRECT PROJECT ID
const SERVICE_ACCOUNT_NAME = "dfda-node-search-user"; // Name for the service account
const SERVICE_ACCOUNT_DISPLAY_NAME = "DFDA Node Vertex AI Search User";
const ROLE_TO_GRANT = "roles/discoveryengine.user"; // Required role
const KEY_FILE_DIRECTORY = path.resolve(process.cwd()); // Save key in the project root
const KEY_FILE_NAME = `${SERVICE_ACCOUNT_NAME}-key.json`;
const KEY_FILE_PATH = path.join(KEY_FILE_DIRECTORY, KEY_FILE_NAME);
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

  // 4. Grant IAM Role
  console.log("\n--- Granting IAM Role ---");
  if (!runCommand(`gcloud projects add-iam-policy-binding ${PROJECT_ID} --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" --role="${ROLE_TO_GRANT}"`)) {
    console.error(`Failed to grant role ${ROLE_TO_GRANT}. Check permissions and ensure service account exists.`);
    process.exit(1);
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
  console.log("✅ GCP Setup Script Completed.");
  console.log("-----------------------------------------------");
  console.log(`ℹ️ Service Account Email: ${SERVICE_ACCOUNT_EMAIL}`);
  console.log(`🔑 Service Account Key File: ${KEY_FILE_PATH}`);
  console.log("\n⚠️ IMPORTANT: ⚠️");
  console.log("1. Secure the generated key file (${KEY_FILE_NAME}). DO NOT commit it to Git.");
  console.log("2. For Vercel deployment, copy the ENTIRE content of the key file.");
  console.log("3. Add it as an environment variable named GOOGLE_APPLICATION_CREDENTIALS in your Vercel project settings.");
  console.log("4. Also ensure GOOGLE_CLOUD_PROJECT_ID is set correctly in Vercel.");
  console.log("5. For local development using ADC, this key file is usually not needed if you ran 'gcloud auth application-default login'.");

}

// Run the setup
setupGcp(); 