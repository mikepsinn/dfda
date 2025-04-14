import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env (instead of .env.local)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'user_uploads'; // The name of the bucket we want to ensure exists

if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    'Error: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local. This key is required for admin operations like creating buckets.'
  );
  console.error('Ensure this key is kept secret and not committed to version control.');
  process.exit(1);
}

// Initialize Supabase client with Service Role Key for admin operations
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false, // No need to persist session for a script
    autoRefreshToken: false,
  },
});

async function setupSupabase() {
  console.log(`Checking if bucket "${bucketName}" exists...`);

  try {
    // Attempt to get the bucket details. This will throw an error if it doesn't exist.
    const { data: existingBucket, error: getError } = await supabaseAdmin.storage.getBucket(bucketName);

    if (existingBucket) {
      console.log(`Bucket "${bucketName}" already exists. No action needed.`);
      // Optionally: check if public status matches and update if needed
      if (existingBucket.public !== false) {
         console.warn(`Bucket "${bucketName}" is currently public. Updating to private.`);
         const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, { public: false });
         if (updateError) {
            console.error(`Failed to update bucket "${bucketName}" to private:`, updateError.message);
         } else {
            console.log(`Bucket "${bucketName}" updated to private successfully.`);
         }
      }
    } else if (getError && getError.message.includes('Bucket not found')) {
      // Bucket does not exist, proceed to create it
      console.log(`Bucket "${bucketName}" not found. Creating...`);
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(
        bucketName,
        {
          public: false, // Ensure the bucket is private
          // fileSizeLimit: '50mb', // Optional: Set limits if needed
          // allowedMimeTypes: ['image/png', 'application/pdf'], // Optional: Set allowed types
        }
      );

      if (createError) {
        console.error(`Error creating bucket "${bucketName}":`, createError.message);
        process.exit(1);
      } else {
        console.log(`Successfully created private bucket "${bucketName}" with ID: ${newBucket?.name}`);
      }
    } else {
      // Some other error occurred when trying to get the bucket
      console.error(`Error checking for bucket "${bucketName}":`, getError?.message || 'Unknown error');
      process.exit(1);
    }

    // Note: RLS policies for storage.objects are applied via SQL migrations,
    // so we don't need to handle them here.

  } catch (error: any) {
    console.error('An unexpected error occurred during Supabase setup:', error.message);
    process.exit(1);
  }
}

setupSupabase(); 