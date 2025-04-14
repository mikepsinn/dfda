import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import {
    InstancesClient,
    FirewallsClient,
    ImagesClient
} from '@google-cloud/compute';

dotenv.config(); // Load environment variables from .env file

// --- Configuration Constants ---
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCP_ZONE = process.env.GCP_ZONE;
const GCP_KEYFILE_PATH_ENV = process.env.GCP_KEYFILE_PATH;
const ROOT_CREDENTIAL_FILENAME = 'gcp-credentials.json';
const INSTANCE_NAME = 'supabase-instance'; // Changed
const MACHINE_TYPE = 'e2-medium';         // Changed
const DISK_SIZE_GB = 50;                // Changed
const IMAGE_PROJECT = 'ubuntu-os-cloud';
const IMAGE_FAMILY = 'ubuntu-2204-lts';
const NETWORK_TAG = 'supabase-server';     // Changed
const FIREWALL_RULE_NAME = 'allow-supabase-ports'; // Changed

// Startup script to install Docker, clone Supabase, generate secrets, and run
const STARTUP_SCRIPT = `#!/bin/bash
set -e # Exit on error
echo "Starting Supabase setup script..."

# Install prerequisites
apt-get update
apt-get install -y git docker.io docker-compose pwgen

systemctl enable --now docker

# Clone Supabase
cd /opt
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Copy initial .env
cp .env.example .env

# --- Generate Secure Secrets --- 
echo "Generating secure secrets..."

# Use pwgen for random strings, ensure complex enough
# For JWT, we need exactly 40 chars for the example, but generally >32 is good
# For ANON/SERVICE keys, they are derived from JWT usually, but here we generate random ones as placeholders
# In a real scenario, derive them properly or use the Supabase key generator
NEW_POSTGRES_PASSWORD=$(pwgen -s 64 1)
NEW_JWT_SECRET=$(pwgen -s 40 1) # Adjust length if needed
NEW_ANON_KEY=$(pwgen -s 128 1)
NEW_SERVICE_KEY=$(pwgen -s 128 1)
NEW_DASHBOARD_PASSWORD=$(pwgen -s 32 1)

# Escape special characters for sed
ESCAPED_POSTGRES_PASSWORD=$(printf '%s' "$NEW_POSTGRES_PASSWORD" | sed 's/[&\/]/\\&/g')
ESCAPED_JWT_SECRET=$(printf '%s' "$NEW_JWT_SECRET" | sed 's/[&\/]/\\&/g')
ESCAPED_ANON_KEY=$(printf '%s' "$NEW_ANON_KEY" | sed 's/[&\/]/\\&/g')
ESCAPED_SERVICE_KEY=$(printf '%s' "$NEW_SERVICE_KEY" | sed 's/[&\/]/\\&/g')
ESCAPED_DASHBOARD_PASSWORD=$(printf '%s' "$NEW_DASHBOARD_PASSWORD" | sed 's/[&\/]/\\&/g')

# Update .env file
echo "Updating .env file with generated secrets..."
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$ESCAPED_POSTGRES_PASSWORD/" .env
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$ESCAPED_JWT_SECRET/" .env
sed -i "s/^ANON_KEY=.*/ANON_KEY=$ESCAPED_ANON_KEY/" .env
sed -i "s/^SERVICE_ROLE_KEY=.*/SERVICE_ROLE_KEY=$ESCAPED_SERVICE_KEY/" .env
sed -i "s/^DASHBOARD_PASSWORD=.*/DASHBOARD_PASSWORD=$ESCAPED_DASHBOARD_PASSWORD/" .env

# Set SITE_URL and SUPABASE_PUBLIC_URL (replace with actual domain/IP later)
echo "Setting placeholder URLs in .env..."
INSTANCE_IP=$(curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
sed -i "s/^SITE_URL=.*/SITE_URL=http:\/\/$INSTANCE_IP:8000/" .env
sed -i "s/^SUPABASE_PUBLIC_URL=.*/SUPABASE_PUBLIC_URL=http:\/\/$INSTANCE_IP:8000/" .env

# --- Log Secrets to Serial Console (Port 1) --- 
echo "--- IMPORTANT: Generated Supabase Secrets --- " > /dev/ttyS0
echo "Retrieve these secrets SECURELY from the GCE Serial Console." > /dev/ttyS0
echo "POSTGRES_PASSWORD=$NEW_POSTGRES_PASSWORD" > /dev/ttyS0
echo "JWT_SECRET=$NEW_JWT_SECRET" > /dev/ttyS0
echo "ANON_KEY=$NEW_ANON_KEY" > /dev/ttyS0
echo "SERVICE_ROLE_KEY=$NEW_SERVICE_KEY" > /dev/ttyS0
echo "DASHBOARD_USERNAME=supabase" > /dev/ttyS0
echo "DASHBOARD_PASSWORD=$NEW_DASHBOARD_PASSWORD" > /dev/ttyS0
echo "--- End Supabase Secrets --- " > /dev/ttyS0

# Pull images and start Supabase
echo "Pulling Supabase docker images..."
docker compose pull

echo "Starting Supabase services..."
docker compose up -d

echo "Supabase setup script finished."
`;

// --- Determine Credentials Path (same as index.ts) ---
function getCredentialsPath(): string | undefined {
    const rootCredsPath = path.resolve(__dirname, '../../..', ROOT_CREDENTIAL_FILENAME);
    if (fs.existsSync(rootCredsPath)) {
        console.log(`Using credentials from root file: ${rootCredsPath}`);
        return rootCredsPath;
    }
    if (GCP_KEYFILE_PATH_ENV) {
        const envCredsPath = path.resolve(GCP_KEYFILE_PATH_ENV);
        if (fs.existsSync(envCredsPath)) {
            console.log(`Using credentials from .env path: ${envCredsPath}`);
            return envCredsPath;
        }
        console.warn(`Warning: GCP_KEYFILE_PATH specified in .env, but file not found at ${envCredsPath}`);
    }
    console.log('Using Application Default Credentials (ADC).');
    return undefined;
}
const keyFilename = getCredentialsPath();

// --- Google Cloud Clients (same as index.ts) ---
const clientOptions = {
    projectId: GCP_PROJECT_ID,
    ...(keyFilename && { keyFilename }),
};
const instancesClient = new InstancesClient(clientOptions);
const firewallsClient = new FirewallsClient(clientOptions);
const imagesClient = new ImagesClient(clientOptions);

// --- Helper Functions (same as index.ts) ---
async function getLatestImageUri(project: string, family: string): Promise<string> {
    const [response] = await imagesClient.getFromFamily({ project, family });
    if (!response.selfLink) {
        throw new Error(`Could not find latest image for family ${family} in project ${project}`);
    }
    console.log(`Using image: ${response.selfLink}`);
    return response.selfLink;
}

// --- Main Deployment Logic ---
async function deploySupabaseInstance() {
    console.log('Starting Supabase GCE deployment...');

    if (!GCP_PROJECT_ID || !GCP_ZONE) {
        console.error('Error: GCP_PROJECT_ID and GCP_ZONE must be set in the .env file.');
        process.exit(1);
    }

    try {
        // 1. Get the latest Ubuntu 22.04 image
        const sourceImageUri = await getLatestImageUri(IMAGE_PROJECT, IMAGE_FAMILY);

        // 2. Define and create the Supabase firewall rule
        console.log(`Creating firewall rule '${FIREWALL_RULE_NAME}'...`);
        const firewallRule = {
            name: FIREWALL_RULE_NAME,
            direction: 'INGRESS',
            priority: 1000,
            network: `projects/${GCP_PROJECT_ID}/global/networks/default`,
            allowed: [
                { IPProtocol: 'tcp', ports: ['22'] },          // SSH
                { IPProtocol: 'tcp', ports: ['8000'] },       // Supabase API Gateway/Studio
                { IPProtocol: 'tcp', ports: ['5432'] },       // Postgres Direct/Session
                { IPProtocol: 'tcp', ports: ['6543'] },       // Supavisor Pooler
            ],
            targetTags: [NETWORK_TAG],
            sourceRanges: ['0.0.0.0/0'],
        };

        const [firewallOp] = await firewallsClient.insert({
            firewallResource: firewallRule,
        });
        await firewallOp.promise();
        console.log(`Firewall rule '${FIREWALL_RULE_NAME}' created successfully.`);

        // 3. Define and create the GCE instance for Supabase
        console.log(`Creating GCE instance '${INSTANCE_NAME}' in zone ${GCP_ZONE}...`);
        const instanceConfig = {
            name: INSTANCE_NAME,
            machineType: `zones/${GCP_ZONE}/machineTypes/${MACHINE_TYPE}`,
            disks: [{
                initializeParams: {
                    sourceImage: sourceImageUri,
                    diskSizeGb: DISK_SIZE_GB.toString(),
                    diskType: `zones/${GCP_ZONE}/diskTypes/pd-standard`,
                },
                autoDelete: true,
                boot: true,
            }],
            networkInterfaces: [{
                name: 'global/networks/default',
                accessConfigs: [{
                    name: 'External NAT',
                    type: 'ONE_TO_ONE_NAT',
                }],
            }],
            tags: {
                items: [NETWORK_TAG],
            },
            metadata: {
                items: [
                    {
                        key: 'startup-script',
                        value: STARTUP_SCRIPT,
                    },
                ],
            },
        };

        const [instanceOp] = await instancesClient.insert({
            zone: GCP_ZONE,
            instanceResource: instanceConfig,
        });

        console.log('Waiting for instance creation to complete...');
        await instanceOp.promise();

        console.log(`Instance '${INSTANCE_NAME}' created successfully in zone ${GCP_ZONE}.`);
        console.log('Supabase installation is running via the startup script.');
        console.log('--- IMPORTANT --- ');
        console.log('Generated secrets (POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, DASHBOARD_PASSWORD) have been logged to the GCE instance\'s Serial Console (Port 1).');
        console.log('Please retrieve them securely as soon as possible.');
        console.log('It might take several minutes for Supabase services to be fully up and running.');

    } catch (error) {
        console.error('Supabase Deployment failed:', error);
        process.exit(1);
    }
}

// --- Run the deployment ---
deploySupabaseInstance(); 