import { setupSupabase } from '../shared/supabase-setup';

async function globalSetup() {
  console.log('Starting E2E test setup...');
  
  try {
    // Setup Supabase for E2E tests
    await setupSupabase();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Failed to setup database:', error);
    throw error;
  }
}

export default globalSetup; 