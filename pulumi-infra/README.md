# Pulumi Infrastructure for dfda-node on GCP

This Pulumi project provisions the necessary Google Cloud Platform (GCP) infrastructure to host a Coolify instance (running Supabase) on a Compute Engine VM and deploy the `dfda-node` application to Cloud Run.

## Resources Managed

*   **GCP VPC Network (`coolify-vpc`):** A custom Virtual Private Cloud for network isolation.
*   **GCP Subnet (`coolify-subnet`):** A subnet within the VPC (`10.10.0.0/24`).
*   **GCP Firewall Rules:**
    *   `coolify-mgmt-fw`: Allows management access (SSH:22, Coolify UI:8000, HTTP:80, HTTPS:443) to the Coolify VM from the IP address specified in Pulumi config (`myPublicIp`).
    *   `supabase-db-fw`: Allows database access (PostgreSQL:5432, Supabase Studio:6001/6002) *only* from the Cloud Run VPC Access Connector.
*   **GCP Compute Engine VM (`coolify-vm`):** An `e2-standard-2` instance running Ubuntu 22.04 LTS. Includes a startup script to automatically install Docker and [Coolify](https://coolify.io/) (Method 1).
*   **GCP Serverless VPC Access Connector (`cloudrun-connector`):** Enables Cloud Run to communicate with resources (like the Coolify VM) within the VPC (`10.10.1.0/28`).
*   **GCP Artifact Registry Repository (`dfda-node-repo`):** A Docker repository to store images for the `dfda-node` application.
*   **GCP Workload Identity Federation:**
    *   Pool (`github-actions-pool`) and Provider (`github-provider`) configured for GitHub Actions OIDC authentication. See [GCP Docs](https://cloud.google.com/iam/docs/workload-identity-federation).
    *   Service Account (`github-actions-sa`) for GitHub Actions with necessary IAM roles (`artifactregistry.writer`, `run.developer`, `iam.workloadIdentityUser`, `iam.serviceAccountUser`).
*   **GCP Secret Manager Secret (`DOPPLER_TOKEN`):** Stores the Doppler service token used by Cloud Run. Manage secrets in the [GCP Secret Manager Console](https://console.cloud.google.com/security/secret-manager).
*   **GCP Cloud Run Service (`dfda-node-service`):** Hosts the `dfda-node` application, configured for VPC egress and mounting the `DOPPLER_TOKEN` secret. Public access is enabled (`roles/run.invoker` for `allUsers`). Manage services in the [GCP Cloud Run Console](https://console.cloud.google.com/run).
*   **IAM Bindings:** Configures permissions for the GitHub Actions Service Account and the Cloud Run Service Account (for Secret Manager access). Manage IAM roles in the [GCP IAM Console](https://console.cloud.google.com/iam-admin/iam).

## Prerequisites

*   [Pulumi CLI](https://www.pulumi.com/docs/install/) installed and [configured for GCP](https://www.pulumi.com/docs/clouds/gcp/get-started/).
*   [Node.js](https://nodejs.org/en/download/) (which includes npm) and [`pnpm`](https://pnpm.io/installation) installed.
*   GCP Project created ([GCP Console](https://console.cloud.google.com/)).
*   [Doppler](https://doppler.com/) account and a project set up.
*   A Doppler [Service Token](https://docs.doppler.com/docs/service-tokens) with access to the required secrets.

## Configuration

Before running `pulumi up`, configure the following settings using the Pulumi CLI:

```bash
# Required:
pulumi config set gcp:project <your-gcp-project-id>
pulumi config set myPublicIp <your-public-ip>/32 --secret # Your workstation's public IP for VM access
pulumi config set dopplerToken <your-doppler-service-token> --secret

# Optional (defaults to us-central1 / us-central1-a):
# pulumi config set gcp:region <your-gcp-region>
# pulumi config set gcp:zone <your-gcp-zone>

# Optional (replace if your GitHub repo is different):
# You might need to update the `githubRepo` variable directly in index.ts if not using "your-github-org/your-repo-name"
# pulumi config set githubRepo your-org/your-repo
```

**Important:** Ensure your Doppler project contains the necessary secrets required by the GitHub Actions workflow (see [`.github/workflows/deploy-gcp.yml`](../.github/workflows/deploy-gcp.yml) for details) and your `dfda-node` application runtime. Manage Doppler secrets at [https://dashboard.doppler.com/](https://dashboard.doppler.com/).

## Usage

1.  **Install Dependencies:**
    ```bash
    pnpm install
    ```
2.  **Deploy Infrastructure:**
    ```bash
    pulumi up
    ```
    Review the plan and confirm the deployment. Note the stack outputs.

3.  **Post-Deployment Steps:**
    *   Follow the manual steps outlined in the main project README to set up [Coolify](https://coolify.io/docs/) and [Supabase](https://supabase.com/docs), and update the `DATABASE_URL` in Doppler.
    *   Configure the `DOPPLER_TOKEN` as a secret in your [GitHub repository secrets settings](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository). (Typically `https://github.com/your-org/your-repo/settings/secrets/actions`).
    *   Push the GitHub Actions workflow file (`.github/workflows/deploy-gcp.yml`) to trigger the first deployment. Check progress in the [GitHub Actions tab](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history) (Typically `https://github.com/your-org/your-repo/actions`).

## Stack Outputs

*   `coolifyVmPublicIp`: Public IP address of the Coolify VM. Access via `http://<IP>:8000`.
*   `coolifyVmPrivateIp`: Private IP address of the Coolify VM. Used for internal connections (e.g., `DATABASE_URL`).
*   `artifactRegistryRepositoryName`: Full name of the Artifact Registry repository. View in [GCP Artifact Registry Console](https://console.cloud.google.com/artifacts).
*   `githubActionsPoolId`: ID of the Workload Identity Pool.
*   `githubActionsProviderId`: Full ID of the Workload Identity Pool Provider (use for GitHub secret `GCP_WORKLOAD_IDENTITY_PROVIDER`).
*   `githubActionsServiceAccountEmail`: Email of the Service Account for GitHub Actions (use for GitHub secret `GCP_SERVICE_ACCOUNT`).
*   `cloudRunServiceUrl`: URL of the deployed `dfda-node` Cloud Run service. 