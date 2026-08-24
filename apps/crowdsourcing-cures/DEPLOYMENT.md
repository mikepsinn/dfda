# Deployment Guide

This guide explains how to deploy the Next.js application to AWS Lightsail Container Service using Doppler for environment variable management.

## Prerequisites

1. Install the [AWS CLI](https://aws.amazon.com/cli/)
2. Configure AWS credentials with `aws configure`
3. PowerShell 7+ (for Windows setup script)
4. [Doppler CLI](https://docs.doppler.com/docs/install-cli) (for local development)

## Initial Setup

### 1. Create AWS IAM User

1. Go to AWS IAM Console
2. Create a new user with programmatic access
3. Attach the following policies:
   - `AWSLightsailFullAccess`
   - `AWSLightsailContainerServiceFullAccess`
4. Save the Access Key ID and Secret Access Key

### 2. Set Up Doppler

1. Create a Doppler account at [https://doppler.com](https://doppler.com)
2. Create a new project:
   - Go to "Projects" > "Create Project"
   - Name it (e.g., "decentralized-fda")
   - Choose "From Scratch" as template

3. Set up environments:
   - By default, you'll have `dev`, `stg`, and `prd` configs
   - Each config is a separate environment for your secrets

4. Add your environment variables:
   - Go to your project's dashboard
   - Select the `prd` (production) config
   - Click "Add Secret"
   - Copy all variables from your `.env` file
   - For each environment-specific value (e.g., database URLs), update accordingly

5. Create a service token:
   - Go to "Project Settings" > "Service Tokens"
   - Click "Generate New Service Token"
   - Name: "Production Deployment"
   - Access: "Read"
   - Config: "prd" (or your production config)
   - Click "Generate Token"
   - Save the token immediately - you won't see it again!

### 3. Get Required Doppler Values

You'll need three values from Doppler for GitHub secrets:

1. **DOPPLER_TOKEN**:
   - This is the service token you generated above
   - Format: `dp.st.prd.xxxxxxxxxxxx`

2. **DOPPLER_PROJECT**:
   - This is your project name
   - Find it in the URL: `https://dashboard.doppler.com/workplace/[workplace]/projects/[project-name]`
   - Or in the project dropdown at the top of the dashboard

3. **DOPPLER_CONFIG**:
   - This is your environment name
   - Use `prd` for production
   - Find it in the config dropdown in your project dashboard

### 4. Set Up Container Service

On Windows, run the setup script:

```powershell
.\scripts\setup-lightsail.ps1 -ServiceName "your-service-name" -Region "your-region"
```

This will:
- Create a Lightsail container service
- Generate initial deployment configuration
- Output next steps

### 5. Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add the following secrets:

AWS Secrets:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: Your chosen AWS region (e.g., "us-east-1")
- `LIGHTSAIL_SERVICE_NAME`: The name you chose for your service

Doppler Secrets:
- `DOPPLER_TOKEN`: Your service token (e.g., `dp.st.prd.xxxxxxxxxxxx`)
- `DOPPLER_PROJECT`: Your project name (e.g., "decentralized-fda")
- `DOPPLER_CONFIG`: The config name (e.g., "prd")

## Local Development

1. Install Doppler CLI:
```bash
# macOS
brew install doppler

# Windows
scoop install doppler

# Linux
curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh
```

2. Login to Doppler:
```bash
doppler login
```

3. Configure project:
```bash
doppler setup
```
When prompted:
- Select your project
- Choose `dev` config for local development
- This creates a `.doppler.env` file (already in .gitignore)

4. Run the app locally with Doppler:
```bash
doppler run -- pnpm dev
```

## Deployment Process

1. Push to the `main` branch or manually trigger the workflow
2. The GitHub Action will:
   - Build the Docker image with Doppler CLI
   - Push to Lightsail container registry
   - Deploy with Doppler configuration
   - Output the service URL

## Environment Variables

All environment variables are managed through Doppler:

1. **Adding New Variables**:
   - Add through Doppler dashboard
   - Changes are immediately available to all environments
   - No need to modify deployment configuration

2. **Accessing Variables**:
   - In code: Use normal `process.env`
   - Local: Use `doppler run`
   - Production: Automatically injected via Doppler CLI

3. **Secrets Rotation**:
   - Rotate secrets in Doppler dashboard
   - No deployment needed
   - Changes take effect on next container restart

## Monitoring & Logs

View logs and monitor your service:

```bash
# View service logs
aws lightsail get-container-log --service-name your-service-name

# Get service metrics
aws lightsail get-container-service-metric-data --service-name your-service-name

# View Doppler audit log
doppler activity
```

## Troubleshooting

1. **Environment Variables Not Available**:
   - Check Doppler service token permissions
   - Verify GitHub secrets are set correctly
   - Check container logs for Doppler CLI errors
   - Verify token has access to correct config

2. **Deployment Fails**:
   - Check GitHub Actions logs
   - Verify AWS credentials
   - Check container service logs
   - Ensure Doppler token has read access

3. **Local Development Issues**:
   - Run `doppler configure` to verify setup
   - Check Doppler CLI is installed correctly
   - Verify local token permissions
   - Try `doppler run env` to debug variables

## Security Best Practices

1. **Doppler Service Tokens**:
   - Use different tokens for each environment
   - Regularly rotate tokens (every 90 days recommended)
   - Limit token permissions to minimum required (read-only for deployment)
   - Never share tokens between projects

2. **Access Control**:
   - Use Doppler RBAC features
   - Audit access regularly
   - Remove unused service tokens
   - Use separate tokens for CI/CD and development

3. **Monitoring**:
   - Enable Doppler audit logs
   - Monitor for suspicious activity
   - Set up alerts for critical changes
   - Review access logs monthly

For support, please open an issue in the GitHub repository. 