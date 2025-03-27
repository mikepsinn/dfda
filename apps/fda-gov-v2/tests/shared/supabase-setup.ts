import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { DEMO_ACCOUNTS } from '@/lib/constants/demo-accounts';
import { execSync } from 'child_process';

// Initialize Supabase client for test setup
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cleanup function to remove test data
export async function cleanupTestData() {
  try {
    // Get all demo account emails
    const demoEmails = Object.values(DEMO_ACCOUNTS).map(account => account.email);
    
    // Find all demo profiles
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('email', demoEmails);

    if (selectError) {
      console.error('Error selecting demo profiles:', selectError);
      throw selectError;
    }

    if (profiles && profiles.length > 0) {
      console.log(`Found ${profiles.length} demo profiles to clean up`);
      
      for (const profile of profiles) {
        // Delete auth user first (cascades to profile)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.id);
        if (deleteError) {
          console.error(`Error deleting user ${profile.email}:`, deleteError);
        } else {
          console.log(`Cleaned up demo account: ${profile.email}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

// Setup Supabase for tests
export async function setupSupabase() {
  try {
    // Start Supabase if not running
    execSync('supabase status', { stdio: 'pipe' });
  } catch (e) {
    console.log('Starting Supabase...');
    execSync('supabase start', { stdio: 'inherit' });
  }

  // Reset database to clean state
  console.log('Resetting database...');
  execSync('supabase db reset --local', { stdio: 'inherit' });
  
  // Clean up any existing test data
  await cleanupTestData();
}

// Cleanup Supabase (optional, typically used in afterAll)
export async function cleanupSupabase() {
  await cleanupTestData();
  // Note: We don't stop Supabase here as it might be needed for other tests
} 