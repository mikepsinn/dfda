# GCP Setup Scripts

This package contains TypeScript scripts to automate the deployment of services like Coolify and Supabase on Google Compute Engine (GCE).

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   A package manager ([npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), or [yarn](https://yarnpkg.com/))
*   [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and configured.
*   A Google Cloud Platform (GCP) project.

## Setup

1.  **Clone/Obtain Package:** Ensure you have this `gcp-setup` package locally.
2.  **Configure Environment:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and replace the placeholder values with your actual:
        *   `GCP_PROJECT_ID`: Your GCP project ID.
        *   `GCP_ZONE`: The desired GCP zone (e.g., `us-central1-a`).
        *   `GCP_KEYFILE_PATH` (Optional): An absolute or relative path to a service account key file. If specified, this overrides other credential methods.
3.  **Install Dependencies:** Navigate to this package directory in your terminal and run:
    ```bash
    npm install
    # or pnpm install
    ```
4.  **Provide GCP Credentials:** The scripts need credentials to interact with your GCP project. They look for credentials in the following order:

    1.  **Root Credential File:** Checks for a file named `gcp-credentials.json` in the repository root directory (three levels up from this package). If found, it uses this key file.
    2.  **`.env` Path Variable:** Checks if `GCP_KEYFILE_PATH` is set in the `packages/gcp-setup/.env` file. If set and the file exists, it uses this key file.
    3.  **Application Default Credentials (ADC):** If neither of the above is found, it falls back to ADC. This includes:
        *   Credentials obtained via `gcloud auth application-default login`.
        *   The path specified in the `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
        *   Credentials attached to the GCE instance (if running on GCE).

    **Recommendation:** For local development, using `gcloud auth application-default login` (ADC method) is often the simplest.

    **Warning:** If using key files (`gcp-credentials.json` or via `GCP_KEYFILE_PATH`), ensure they are **not** committed to version control.

## Deployment

Once setup and authentication are complete, choose the script to run:

### Deploying Coolify

Run the deployment script:

```bash
npm run deploy:coolify
```

**What the Coolify Script Does:**

*   Determines GCP credentials (as described above).
*   Reads configuration (`GCP_PROJECT_ID`, `GCP_ZONE`) from `.env`.
*   Creates firewall `allow-coolify-ports` (TCP 22, 80, 443, 6001, 6002, 8000) tagged `coolify-server`.
*   Creates GCE instance `coolify-instance` (`e2-standard-4`, 150GB disk, Ubuntu 22.04) tagged `coolify-server`.
*   Runs the Coolify install script via instance startup metadata.

### Deploying Supabase

Run the deployment script:

```bash
npm run deploy:supabase
```

**What the Supabase Script Does:**

*   Determines GCP credentials (as described above).
*   Reads configuration (`GCP_PROJECT_ID`, `GCP_ZONE`) from `.env`.
*   Creates firewall `allow-supabase-ports` (TCP 22, 8000, 5432, 6543) tagged `supabase-server`.
*   Creates GCE instance `supabase-instance` (`e2-medium`, 50GB disk, Ubuntu 22.04) tagged `supabase-server`.
*   Runs a startup script via instance metadata that:
    *   Installs Docker, Docker Compose, git, pwgen.
    *   Clones the official Supabase repository.
    *   Generates secure, random secrets for `POSTGRES_PASSWORD`, `JWT_SECRET`, `DASHBOARD_PASSWORD` and placeholder keys for `ANON_KEY`, `SERVICE_ROLE_KEY`.
    *   Updates the `supabase/docker/.env` file on the instance with these generated values and placeholder URLs.
    *   **Logs the generated secrets and keys to the GCE Serial Console (Port 1) for secure retrieval.**
    *   Pulls Supabase Docker images and starts the services using `docker compose up -d`.

**IMPORTANT - Retrieving Supabase Secrets:**
After running the Supabase deployment, you **MUST** retrieve the generated secrets (`POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DASHBOARD_PASSWORD`) from the GCE instance's Serial Console (Port 1). Access this via the Google Cloud Console UI (under the VM instance details) or using the `gcloud compute connect-to-serial-port supabase-instance --port 1` command. Store these secrets securely.

Wait for the scripts to complete. The service installations (Coolify or Supabase) might take several minutes after the instance starts.

## Troubleshooting

*   **`Error: Could not load the default credentials.`**: This means the script tried to use Application Default Credentials (ADC) but couldn't find any. Ensure you have authenticated locally by running `gcloud auth application-default login` in your terminal. Alternatively, verify that one of the key file methods (root `gcp-credentials.json` or `GCP_KEYFILE_PATH` in `.env`) is correctly configured with a valid path to a service account JSON key file. 