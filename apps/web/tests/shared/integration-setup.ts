import '@testing-library/jest-dom';
import { execSync } from 'child_process';

// Ensure test environment
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Integration tests must be run in test environment');
}

// Build the schema before all tests. DATABASE_URL must point to an empty test
// database; db:plain:setup refuses to change a database that has tables.
beforeAll(async () => {
  console.log('Building the test database (db:plain:setup) for integration tests...');
  try {
    // Use execSync for simplicity here, inherit stdio for visibility
    execSync('pnpm run db:plain:setup', { stdio: 'inherit', cwd: process.cwd() });
    console.log('Test database is ready.');
  } catch (error) {
    console.error('Test database setup failed:', error);
    // Throw the error to fail the test suite setup
    throw error; 
  }
}, 300000); // Increase timeout significantly for the full setup script (e.g., 5 minutes)

 