# FDA Marketplace Application

This is the FDA Marketplace application for the decentralized FDA project.

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Copy the `.env.example` file to a new file called `.env` and fill in the values:

```bash
cp .env.example .env
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_PROJECT_ID`: Your Supabase project ID (extracted from the URL)

## Supabase Database Management

This project uses Supabase for database management. The following scripts are available:

### Generate TypeScript Types

Generate TypeScript types from your Supabase database schema:

```bash
pnpm db:types
```

This will create or update the `lib/database.types.ts` file with the latest schema from your Supabase project.

### Pull Database Schema

Pull the latest database schema from your Supabase project:

```bash
pnpm db:pull
```

### Create Migration Diff

Create a migration file based on the differences between your local schema and the remote schema:

```bash
pnpm db:diff
```

This will create migration files in the `migrations` directory.

### Push Local Changes

Push your local schema changes to your Supabase project:

```bash
pnpm db:push
```

## Local Development with Supabase

For local development with Supabase:

1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project:
   ```bash
   npx supabase init
   ```

3. Start a local Supabase instance:
   ```bash
   npx supabase start
   ```

4. Generate types from your local instance:
   ```bash
   npx supabase gen types typescript --local > lib/database.types.ts
   ```

## Recommended Workflow

1. Make local schema changes in your development environment
2. Run `pnpm db:diff` to generate migration files
3. Test your changes locally
4. Run `pnpm db:push` to push changes to your Supabase project
5. Run `pnpm db:types` to update your TypeScript types 