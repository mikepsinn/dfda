import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

test.describe('Demo Login Flow', () => {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Using service role key for admin operations
  );

  test.beforeAll(async () => {
    // Ensure the profiles table exists and has the correct schema
    const { error: createTableError } = await supabase.rpc('create_profiles_if_not_exists');
    if (createTableError) {
      console.error('Error creating profiles table:', createTableError);
    }
  });

  test.beforeEach(async () => {
    // Clean up any existing demo accounts
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'demo-patient@dfda.earth');

    if (profiles && profiles.length > 0) {
      // Delete auth user and profile
      await supabase.auth.admin.deleteUser(profiles[0].id);
      await supabase.from('profiles').delete().eq('id', profiles[0].id);
    }
  });

  test('should login with demo account and redirect to dashboard', async ({ page }) => {
    // Start from the login page
    await page.goto('/login');
    
    // Click the demo login button
    await page.getByRole('button', { name: /demo/i }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('/patient/dashboard');
    
    // Verify we're on the dashboard
    expect(page.url()).toContain('/patient/dashboard');
    
    // Verify the demo user was created in the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'demo-patient@dfda.earth')
      .single();
    
    expect(error).toBeNull();
    expect(profile).toBeTruthy();
    expect(profile.user_type).toBe('patient');
    expect(profile.first_name).toBe('Demo');
    expect(profile.last_name).toBe('Patient');
  });

  test('should handle demo login errors gracefully', async ({ page }) => {
    // Break the database connection temporarily
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:12345';
    
    await page.goto('/login');
    await page.getByRole('button', { name: /demo/i }).click();
    
    // Should show error message
    await expect(page.getByText(/failed to log in/i)).toBeVisible();
    
    // Restore the connection
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  });

  test.afterAll(async () => {
    // Clean up all test data
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'demo-patient@dfda.earth');

    if (profiles && profiles.length > 0) {
      await supabase.auth.admin.deleteUser(profiles[0].id);
      await supabase.from('profiles').delete().eq('id', profiles[0].id);
    }
  });
}); 