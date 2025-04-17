import '@testing-library/jest-dom';
// Remove Supabase setup imports as we'll call the script directly
// import { setupSupabase, cleanupSupabase } from './supabase-setup'; 
import { execSync } from 'child_process';

// Ensure test environment
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Integration tests must be run in test environment');
}

// Setup before all tests by running the full local setup script
beforeAll(async () => {
  console.log('Running full local setup script (db:setup) for integration tests...');
  try {
    // Use execSync for simplicity here, inherit stdio for visibility
    execSync('pnpm run db:setup', { stdio: 'inherit', cwd: process.cwd() });
    console.log('Full local setup script completed.');
  } catch (error) {
    console.error('Full local setup script failed:', error);
    // Throw the error to fail the test suite setup
    throw error; 
  }
}, 300000); // Increase timeout significantly for the full setup script (e.g., 5 minutes)

// Cleanup after all tests - REMOVED as db:setup handles reset at start
// afterAll(async () => {
//   await cleanupSupabase();
// }); 