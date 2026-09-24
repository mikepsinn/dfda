import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env from Doppler (assume script is run with `doppler run -- tsx scripts/query.ts`)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable not set.');
  process.exit(1);
}

// Get query from command line or prompt
async function getQuery(): Promise<string> {
  const argQuery = process.argv.slice(2).join(' ').trim();
  if (argQuery) return argQuery;

  // If no query provided, prompt the user
  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Enter SQL query: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const query = await getQuery();
  if (!query) {
    console.error('No query provided.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    const res = await client.query(query);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err: any) {
    console.error('Query failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main(); 