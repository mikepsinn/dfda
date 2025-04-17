import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { updateProfileAction, getProfileByIdAction } from '@/app/actions/profiles';

// Unmock Supabase client to use real server actions
jest.unmock('@/lib/supabase');

describe('Minimal Integration: Profile Update', () => {
  // Create an admin client for direct interaction
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  it('should create a user and update their profile first_name', async () => {
    const uniqueTimestamp = Date.now();
    const testEmail = `minimal-test-${uniqueTimestamp}@dfda.earth`;
    const testPassword = 'password123';
    let testUserId: string | undefined;

    try {
      // 1. Create Auth User
      console.log(`Minimal Test: Creating user ${testEmail}...`);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true, // Auto-confirm for tests
      });

      if (authError || !authData.user) {
        throw new Error(`Minimal Test: Failed to create auth user: ${authError?.message}`);
      }
      testUserId = authData.user.id;
      console.log(`Minimal Test: Created user ${testUserId}`);

      // 2. Wait briefly for potential trigger completion
      await new Promise(resolve => setTimeout(resolve, 500)); 

      // 3. Call the Action to Update Profile First Name
      const newFirstName = `MinimalTestUser-${uniqueTimestamp}`;
      console.log(`Minimal Test: Updating first_name for ${testUserId} to ${newFirstName}...`);
      const updatedProfile = await updateProfileAction(testUserId!, { first_name: newFirstName });

      // Assertions - Check for null first
      expect(updatedProfile).not.toBeNull();
      if (updatedProfile) { // Type guard
        expect(updatedProfile.id).toBe(testUserId);
        expect(updatedProfile.first_name).toBe(newFirstName);
        // 4. Verify directly from DB via Action
        console.log(`Minimal Test: Fetching profile for ${testUserId} to verify...`);
        const fetchedProfile = await getProfileByIdAction(testUserId!);
        expect(fetchedProfile).toBeDefined();
        expect(fetchedProfile?.first_name).toBe(newFirstName);
        console.log(`Minimal Test: getProfileByIdAction returned profile with first_name ${fetchedProfile?.first_name}`);
      } else {
        // Fail the test explicitly if null is unexpected
        fail("updateProfileAction returned null unexpectedly.");
      }

    } finally {
      // 5. Cleanup
      if (testUserId) {
        console.log(`Minimal Test: Cleaning up user ${testUserId}...`);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(testUserId);
        if (deleteError) {
          console.error(`Minimal Test: Error cleaning up test user ${testUserId}:`, deleteError.message);
        }
      }
    }
  }, 30000); // Increased timeout for safety
}); 