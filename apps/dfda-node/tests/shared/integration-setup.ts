import '@testing-library/jest-dom';
import { setupSupabase, cleanupSupabase } from './supabase-setup';

// Ensure test environment
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Integration tests must be run in test environment');
}

// Setup before all tests
beforeAll(async () => {
  await setupSupabase();
});

// Cleanup after all tests
afterAll(async () => {
  await cleanupSupabase();
}); 