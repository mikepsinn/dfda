# Data Integration System Plan & Todo

## Overall Plan

1.  **Foundation:** Set up the core database tables (`integration_sources`, `user_integrations`, `import_jobs`, and potentially staging tables).
2.  **Base Handler:** Create the `BaseIntegrationHandler` abstract class (`lib/integrations/base.ts`) defining the common structure (`authenticate`, `fetchData`, `mapData`, `processImport`).
3.  **Auth Helpers (Composition):** Create initial helper utilities for common auth patterns (e.g., API Key, OAuth2 base) in a new `lib/auth/` directory.
4.  **Worker Update:** Modify `worker/runner.ts` to dynamically instantiate and call the appropriate handler based on the `import_jobs.integration_source_id`.
5.  **Implement First Integration:** Choose a specific source and implement its concrete handler class (e.g., `GoogleFitHandler`) inheriting from `BaseIntegrationHandler` and using the relevant auth helper.
6.  **User Configuration:** Build the necessary UI (`components/`) and backend logic (Server Actions or Supabase Functions) for users to authorize and configure this first integration.
7.  **Scheduling/Triggering:** Implement the mechanism(s) to create `import_jobs` (e.g., `pg_cron` for scheduled tasks, Server Actions for manual triggers/uploads).
8.  **Testing:** Thoroughly test the end-to-end flow for the first integration, including authentication, data fetching, mapping, saving, and job status updates.
9.  **Refinement:** Review and refactor the base class, helpers, and overall process based on learnings from the first integration.
10. **Add More Integrations:** Repeat steps 5-8 for subsequent integration sources, leveraging the established framework.

## Todo List

### Database Schema (`supabase/migrations/`)
- [ ] Create migration for `integration_sources` table.
- [ ] Create migration for `user_integrations` table (define columns, consider secure credential storage strategy).
- [ ] Create migration for `import_jobs` table (define columns for status, source, details, timestamps).
- [ ] *Optional:* Create migration for an example staging table (e.g., `staged_measurements`).
- [ ] Add `INSERT` statement migration for the first integration source definition in `integration_sources`.

### Core Abstraction (`lib/`)
- [ ] Define `BaseIntegrationHandler` abstract class (`lib/integrations/base.ts`).
- [ ] Create `ApiKeyAuthHelper` utility class/functions (`lib/auth/api-key-helper.ts`).
- [ ] Create `OAuth2Helper` utility class/functions (`lib/auth/oauth2-helper.ts`).

### Worker (`worker/`)
- [ ] Refactor `worker/runner.ts` to:
    - [ ] Fetch job from queue.
    - [ ] Fetch relevant `user_integrations` config if needed.
    - [ ] Instantiate the correct `BaseIntegrationHandler` subclass based on `job.integration_source_id`.
    - [ ] Call the handler's `processImport()` method.
    - [ ] Update job status (`import_jobs`) based on the result.
- [ ] Decide fate of `worker/tasks.ts` (might become obsolete or just hold the runner loop).

### First Integration Implementation (Example: Google Fit)
- [ ] Create handler class `GoogleFitHandler` (`lib/integrations/google-fit.ts`) extending `BaseIntegrationHandler`.
- [ ] Implement `authenticate()` method using `OAuth2Helper` and stored credentials.
- [ ] Implement `fetchData()` method using Google Fit API (or SDK).
- [ ] Implement `mapData()` method to transform Google Fit data to `measurements` table schema.

### User Configuration (Frontend & Backend)
- [ ] Create UI components for listing available integrations (`components/integrations/IntegrationList.tsx`).
- [ ] Create UI components for adding/configuring the first integration (e.g., Button to trigger OAuth flow `components/integrations/GoogleFitSetup.tsx`).
- [ ] Create Server Action/Supabase Function to handle the OAuth callback from the provider (e.g., Google).
- [ ] Create Server Action/Supabase Function to securely save/update the user's configuration and credentials in `user_integrations`.
- [ ] Create Server Action/UI element for manually triggering an import job.

### Job Creation & Scheduling
- [ ] Set up `pg_cron` (or alternative) to create scheduled `import_jobs` if required.
- [ ] Ensure manual triggers (UI buttons, file uploads) correctly create entries in `import_jobs`.

### Testing & Documentation
- [ ] Write unit/integration tests for Auth Helpers.
- [ ] Write unit/integration tests for the first Handler (`GoogleFitHandler`).
- [ ] Perform end-to-end testing: Configure -> Trigger Job -> Worker Runs -> Data Saved -> Job Status Updated.
- [ ] Document the process for adding a *new* integration handler following this pattern.

### Refinement
- [ ] Review base class and helpers after first integration is working.
- [ ] Refactor common logic found during implementation.
- [ ] Improve error handling and logging (use `lib/logger.ts`).
