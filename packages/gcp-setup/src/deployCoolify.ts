import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import {
    InstancesClient,
    FirewallsClient,
    ImagesClient,
    GlobalOperationsClient,
    ZoneOperationsClient
} from '@google-cloud/compute';

dotenv.config(); // Load environment variables from .env file

// --- Configuration Constants ---
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCP_ZONE = process.env.GCP_ZONE;
const GCP_KEYFILE_PATH_ENV = process.env.GCP_KEYFILE_PATH;
const ROOT_CREDENTIAL_FILENAME = 'gcp-credentials.json';
const INSTANCE_NAME = 'coolify-instance';
const MACHINE_TYPE = 'e2-standard-4';
const DISK_SIZE_GB = 150;
const IMAGE_PROJECT = 'ubuntu-os-cloud';
const IMAGE_FAMILY = 'ubuntu-2204-lts';
const NETWORK_TAG = 'coolify-server';
const FIREWALL_RULE_NAME = 'allow-coolify-ports';
const STARTUP_SCRIPT = `#!/bin/bash
apt-get update
apt-get install -y wget
wget -q https://get.coollabs.io/coolify/install.sh -O install.sh
bash ./install.sh -y # Added -y for non-interactive install
`;

// --- Determine Credentials Path ---
function getCredentialsPath(): string | undefined {
    // 1. Check root credential file
    const rootCredsPath = path.resolve(__dirname, '../../..', ROOT_CREDENTIAL_FILENAME);
    if (fs.existsSync(rootCredsPath)) {
        console.log(`Using credentials from root file: ${rootCredsPath}`);
        return rootCredsPath;
    }

    // 2. Check .env variable
    if (GCP_KEYFILE_PATH_ENV) {
        const envCredsPath = path.resolve(GCP_KEYFILE_PATH_ENV);
        if (fs.existsSync(envCredsPath)) {
            console.log(`Using credentials from .env path: ${envCredsPath}`);
            return envCredsPath;
        }
        console.warn(`Warning: GCP_KEYFILE_PATH specified in .env, but file not found at ${envCredsPath}`);
    }

    // 3. Fallback to ADC (library handles GOOGLE_APPLICATION_CREDENTIALS env var and gcloud auth)
    console.log('Using Application Default Credentials (ADC).');
    return undefined; // Let the library use ADC
}

const keyFilename = getCredentialsPath();

// --- Google Cloud Clients ---
const clientOptions = {
    projectId: GCP_PROJECT_ID,
    ...(keyFilename && { keyFilename }), // Conditionally add keyFilename if found
};

const instancesClient = new InstancesClient(clientOptions);
const firewallsClient = new FirewallsClient(clientOptions);
const imagesClient = new ImagesClient(clientOptions);
const globalOperationsClient = new GlobalOperationsClient(clientOptions);
const zoneOperationsClient = new ZoneOperationsClient(clientOptions);

// --- Helper Functions ---
async function getLatestImageUri(project: string, family: string): Promise<string> {
    const [response] = await imagesClient.getFromFamily({
        project,
        family,
    });
    if (!response.selfLink) {
        throw new Error(`Could not find latest image for family ${family} in project ${project}`);
    }
    console.log(`Using image: ${response.selfLink}`);
    return response.selfLink;
}

// --- Main Deployment Logic ---
async function deployCoolifyInstance() {
    console.log('Starting Coolify GCE deployment...');

    if (!GCP_PROJECT_ID || !GCP_ZONE) {
        console.error('Error: GCP_PROJECT_ID and GCP_ZONE must be set in the .env file.');
        process.exit(1);
    }

    try {
        // 1. Get the latest Ubuntu 22.04 image
        const sourceImageUri = await getLatestImageUri(IMAGE_PROJECT, IMAGE_FAMILY);

        // 2. Check if firewall rule exists, create if not
        let firewallExists = false;
        console.log(`Checking if firewall rule '${FIREWALL_RULE_NAME}' exists...`);
        try {
            await firewallsClient.get({
                project: GCP_PROJECT_ID,
                firewall: FIREWALL_RULE_NAME,
            });
            console.log(`Firewall rule '${FIREWALL_RULE_NAME}' already exists. Skipping creation.`);
            firewallExists = true;
        } catch (error: any) {
            if (error.code === 5 || error.code === 404) { 
                console.log(`Firewall rule '${FIREWALL_RULE_NAME}' not found. Proceeding with creation.`);
            } else {
                console.error(`Error checking firewall rule '${FIREWALL_RULE_NAME}':`, error);
                throw error;
            }
        }

        if (!firewallExists) {
            console.log(`Creating firewall rule '${FIREWALL_RULE_NAME}'...`);
            const firewallRule = {
                name: FIREWALL_RULE_NAME,
                direction: 'INGRESS',
                priority: 1000,
                network: `projects/${GCP_PROJECT_ID}/global/networks/default`, // Assuming default network
                allowed: [
                    { IPProtocol: 'tcp', ports: ['22'] },
                    { IPProtocol: 'tcp', ports: ['80', '443'] },
                    { IPProtocol: 'tcp', ports: ['6001', '6002', '8000'] },
                ],
                targetTags: [NETWORK_TAG],
                sourceRanges: ['0.0.0.0/0'], 
            };
    
            const [firewallOpResponse] = await firewallsClient.insert({
                project: GCP_PROJECT_ID,
                firewallResource: firewallRule,
            });
            
            if (firewallOpResponse.latestResponse.name) {
                console.log('Waiting for firewall creation operation...');
                await globalOperationsClient.wait({
                    operation: firewallOpResponse.latestResponse.name,
                    project: GCP_PROJECT_ID,
                });
                console.log('Firewall operation completed.');
            } else {
                console.warn('Firewall operation did not return an operation name.');
            }
            console.log(`Firewall rule '${FIREWALL_RULE_NAME}' created successfully.`);
        }

        // 3. Check if GCE instance exists, create if not, otherwise provide info
        let instanceExists = false;
        let instanceData: any = null; 
        console.log(`Checking if GCE instance '${INSTANCE_NAME}' exists in zone ${GCP_ZONE}...`);
        try {
            const [existingInstance] = await instancesClient.get({
                project: GCP_PROJECT_ID,
                zone: GCP_ZONE,
                instance: INSTANCE_NAME,
            });
            console.log(`Instance '${INSTANCE_NAME}' found.`);
            instanceExists = true;
            instanceData = existingInstance;
        } catch (error: any) {
            if (error.code === 5 || error.code === 404) {
                console.log(`Instance '${INSTANCE_NAME}' not found. Proceeding with creation.`);
                instanceExists = false;
            } else {
                console.error(`Error checking instance '${INSTANCE_NAME}':`, error);
                throw error; 
            }
        }

        if (instanceExists) {
            // Instance exists: Check/enable serial port and log info
            console.log("Checking if serial port access is enabled on existing Coolify instance...");
            const metadata = instanceData.metadata;
            const serialPortEnabled = metadata?.items?.some((item: any) => item.key === 'serial-port-enable' && item.value === 'true');

            if (!serialPortEnabled) {
                console.log("Serial port access not enabled. Attempting to enable...");
                if (!metadata?.fingerprint) {
                    throw new Error("Metadata fingerprint missing, cannot update serial port setting.");
                }
                try {
                    const updatedItems = metadata.items ? [...metadata.items] : [];
                    const existingSerialIndex = updatedItems.findIndex((item: any) => item.key === 'serial-port-enable');
                    if (existingSerialIndex > -1) {
                        updatedItems[existingSerialIndex].value = 'true';
                    } else {
                        updatedItems.push({ key: 'serial-port-enable', value: 'true' });
                    }
                    const [setMetadataOp] = await instancesClient.setMetadata({
                        project: GCP_PROJECT_ID,
                        zone: GCP_ZONE,
                        instance: INSTANCE_NAME,
                        metadataResource: {
                            fingerprint: metadata.fingerprint,
                            items: updatedItems,
                        },
                    });
                    console.log("Waiting for setMetadata operation to complete...");
                    if (setMetadataOp.latestResponse.name) {
                        await zoneOperationsClient.wait({
                            operation: setMetadataOp.latestResponse.name,
                            project: GCP_PROJECT_ID,
                            zone: GCP_ZONE,
                        });
                        console.log("Serial port access enabled successfully for Coolify instance.");
                    } else {
                        console.warn("setMetadata operation did not return an operation name.");
                    }
                } catch (setMetaError) {
                    console.error("Error enabling serial port for Coolify instance:", setMetaError);
                }
            } else {
                console.log("Serial port access is already enabled for Coolify instance.");
            }

            // Log access info
            const externalIp = instanceData?.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || '<EXTERNAL_IP_NOT_FOUND>';
            const instanceConsoleLink = `https://console.cloud.google.com/compute/instancesDetail/zones/${GCP_ZONE}/instances/${INSTANCE_NAME}?project=${GCP_PROJECT_ID}`;
            const gcloudSshCommand = `gcloud compute ssh ${INSTANCE_NAME} --zone ${GCP_ZONE} --project ${GCP_PROJECT_ID}`;
            const coolifyUrl = externalIp !== '<EXTERNAL_IP_NOT_FOUND>' ? `http://${externalIp}:8000` : `http://<EXTERNAL_IP>:8000 (Find External IP in console)`;

        // 2. Define and create the firewall rule
        console.log(`Creating firewall rule '${FIREWALL_RULE_NAME}'...`);
        const firewallRule = {
            name: FIREWALL_RULE_NAME,
            direction: 'INGRESS',
            priority: 1000,
            network: `projects/${GCP_PROJECT_ID}/global/networks/default`, // Assuming default network
            allowed: [
                { // Allow SSH
                    IPProtocol: 'tcp',
                    ports: ['22'],
                },
                { // Allow HTTP/HTTPS for Coolify proxy and webhooks
                    IPProtocol: 'tcp',
                    ports: ['80', '443'],
                },
                { // Allow Coolify core ports
                    IPProtocol: 'tcp',
                    ports: ['6001', '6002', '8000'],
                },
            ],
            targetTags: [NETWORK_TAG],
            sourceRanges: ['0.0.0.0/0'], // Allow traffic from any source
        };

        const [firewallOp] = await firewallsClient.insert({
            // project is implicitly handled by clientOptions
            firewallResource: firewallRule,
        });
        await firewallOp.promise();
        console.log(`Firewall rule '${FIREWALL_RULE_NAME}' created successfully.`);

        // 3. Define and create the GCE instance
        console.log(`Creating GCE instance '${INSTANCE_NAME}' in zone ${GCP_ZONE}...`);
        const instanceConfig = {
            name: INSTANCE_NAME,
            machineType: `zones/${GCP_ZONE}/machineTypes/${MACHINE_TYPE}`,
            disks: [{
                initializeParams: {
                    sourceImage: sourceImageUri,
                    diskSizeGb: DISK_SIZE_GB.toString(),
                    diskType: `zones/${GCP_ZONE}/diskTypes/pd-standard`, // Standard Persistent Disk
                },
                autoDelete: true,
                boot: true,
            }],
            networkInterfaces: [{
                // Use default VPC network
                name: 'global/networks/default',
                // Request a public IP address
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
            // project is implicitly handled by clientOptions
            zone: GCP_ZONE,
            instanceResource: instanceConfig,
        });

        console.log('Waiting for instance creation to complete...');
        await instanceOp.promise();

        console.log(`Instance '${INSTANCE_NAME}' created successfully in zone ${GCP_ZONE}.`);
        console.log('Coolify installation is running via the startup script.');
        console.log('You might need to wait a few minutes for the installation to complete.');

    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

// --- Run the deployment ---
deployCoolifyInstance(); 