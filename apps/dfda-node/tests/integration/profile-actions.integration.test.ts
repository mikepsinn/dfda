import { createProfileAction, getProfileByIdAction, updateProfileAction, deleteProfileAction } from '@/lib/actions/profiles';
import type { ProfileInsert, ProfileUpdate } from "@/lib/actions/profiles";
import type { Database } from "@/lib/database.types";
import { createClient as supabaseJsClient } from '@supabase/supabase-js'; // Assuming this is needed for setup

// Define UserTypeEnum locally 
type UserTypeEnum = Database["public"]["Enums"]["user_type_enum"];


describe("Profile Actions Integration Tests", () => {
  let testUserId: string | undefined;
  const testEmail = `test-profile-${Date.now()}@example.com`;
  const testPassword = 'password123';
  let supabaseAdmin: ReturnType<typeof supabaseJsClient>; // Define type for admin client

  beforeAll(async () => {
    // Setup: Create Supabase admin client and test user
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables are not set.");
    }
    supabaseAdmin = supabaseJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
    // Clean up existing user if any
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw new Error("Failed to list users during setup.");
    const existingUser = users.find(u => u.email === testEmail);
    if (existingUser) {
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    }
    // Create test user
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email for testing
    });
    if (createError || !user) {
      throw new Error(`Failed to create test user: ${createError?.message}`);
    }
    testUserId = user.id;
    console.log(`Created test user with ID: ${testUserId}`);
  });

  // ... (test for createProfileAction) ...
  // ... (test for getProfileByIdAction) ...

  it("should update a profile user_type using updateProfileAction", async () => {
    if (!testUserId) throw new Error('Test user ID not set');
    
    // Ensure profile exists before update (create if needed)
    let profile = await getProfileByIdAction(testUserId);
    if (!profile) {
        const insertData: ProfileInsert = { id: testUserId, email: testEmail, user_type: 'patient' }; // Minimal insert
        profile = await createProfileAction(insertData);
        if (!profile) throw new Error("Failed to create initial profile for update test");
    }

    const newRole: UserTypeEnum = "developer";
    const updates: ProfileUpdate = { user_type: newRole };
    const updatedProfile = await updateProfileAction(testUserId, updates);

    expect(updatedProfile).not.toBeNull();
    if (!updatedProfile) {
       throw new Error("updateProfileAction returned null unexpectedly.");
    }
    
    expect(updatedProfile.id).toBe(testUserId);
    expect(updatedProfile.user_type).toBe(newRole);
    
    // Fetch again to verify DB state
    const fetchedProfile = await getProfileByIdAction(testUserId);
    expect(fetchedProfile).not.toBeNull();
    expect(fetchedProfile?.user_type).toBe(newRole);
  });

  // ... (test for deleteProfileAction) ...
  // ... (test for getCurrentUserProfileAction - might need mocking/session handling) ...

  afterAll(async () => {
    // Cleanup: Delete test user
    if (testUserId) {
      await supabaseAdmin.auth.admin.deleteUser(testUserId);
      console.log(`Deleted test user with ID: ${testUserId}`);
    }
  });
}); 