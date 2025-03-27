import { setupSupabase } from '../shared/supabase-setup';

async function globalSetup() {
  // Setup Supabase for E2E tests
  await setupSupabase();
}

export default globalSetup; 