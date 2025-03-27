import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Initialize Supabase client for test setup
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Setup function to ensure database is ready
export async function setupTestDatabase() {
  try {
    // Create the profiles table and its dependencies
    const { error: createTableError } = await supabase.rpc('create_profiles_if_not_exists');
    if (createTableError) {
      console.error('Error creating profiles table:', createTableError);
      throw createTableError;
    }

    // Clean up any existing test data
    await cleanupTestData();

  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

// Cleanup function to remove test data
export async function cleanupTestData() {
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'demo-patient@dfda.earth');

    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        await supabase.auth.admin.deleteUser(profile.id);
        await supabase.from('profiles').delete().eq('id', profile.id);
      }
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
} 