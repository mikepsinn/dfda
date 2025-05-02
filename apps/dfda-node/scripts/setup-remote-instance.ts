import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { BUCKET_NAME } from '../lib/constants/storage'; // Add import

// --- Load Environment Variables ---
// Load from .env file in the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// const bucketName = 'user_uploads'; // Define the target bucket name - Replaced below

// --- Utility to setup storage bucket ---
async function setupStorageBucket() {
  const bucketName = BUCKET_NAME; // Use imported constant
  console.log(`
--- Setting up Remote Storage Bucket: ${bucketName} ---`);
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
    console.error('These are required to connect to the remote Supabase instance.');
    throw new Error('Missing Supabase credentials for remote storage setup.');
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Check if bucket exists
    const { data: existingBucket, error: getError } = await supabaseAdmin.storage.getBucket(bucketName);

    if (existingBucket) {
      console.log(`Bucket "${bucketName}" already exists.`);
      // Ensure the bucket is private (as per original script logic)
      if (existingBucket.public !== false) {
         console.warn(`Bucket "${bucketName}" is public. Updating to private.`);
         const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, { public: false });
         if (updateError) {
            console.error(`Failed to update bucket "${bucketName}" to private:`, updateError.message);
            throw updateError; // Throw if update fails
         } else {
            console.log(`Bucket "${bucketName}" updated to private.`);
         }
      } else {
        console.log(`Bucket "${bucketName}" is already private.`);
      }
    } else if (getError && getError.message.includes('Bucket not found')) {
      // Bucket doesn't exist, create it
      console.log(`Bucket "${bucketName}" not found. Creating...`);
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, { public: false });
      if (createError) {
        console.error(`Failed to create bucket "${bucketName}":`, createError.message);
        throw createError;
      } else {
        console.log(`Successfully created private bucket "${bucketName}" with ID: ${newBucket?.name}`);
      }
    } else if (getError) {
      // Handle other errors during bucket check
      console.error(`Error checking bucket "${bucketName}":`, getError.message);
      throw getError;
    } else {
        // Unexpected scenario
        throw new Error(`Unknown error checking bucket existence for "${bucketName}".`);
    }

     console.log(`
--- Completed: Remote Storage Bucket Setup for "${bucketName}" ---`);
  } catch (error: any) {
    console.error(`
--- Error setting up remote storage bucket "${bucketName}":`, error.message || error);
    throw error; // Re-throw to fail the main setup
  }
}

// --- Main Setup Function ---
async function setupRemoteInstance() {
  console.log('🚀 Starting Remote Supabase Instance Setup...');

  try {
    // 1. Setup Storage Bucket (currently the main task)
    await setupStorageBucket();

    // Add other remote setup tasks here if needed in the future
    // (e.g., deploying functions if applicable to your setup)

    // Final success message
    console.log(`
Remote instance setup tasks completed successfully!
Project: ${process.env.SUPABASE_PROJECT_ID}
`);

  } catch (error) {
    // Log error and exit
    console.error(`
Remote instance setup failed!
Error: ${error instanceof Error ? error.message : String(error)}
`);
    process.exit(1); // Exit with error code
  }
}

// --- Run the setup ---
setupRemoteInstance(); 