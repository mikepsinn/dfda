import { LightsailClient, CreateContainerServiceCommand, UpdateContainerServiceCommand, CreateContainerServiceDeploymentCommand, GetContainerServicesCommand } from "@aws-sdk/client-lightsail";
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const serviceName = 'dfda-web';
const containerName = 'dfda-web';

// Initialize Lightsail client
const lightsail = new LightsailClient({
    region: process.env.LIGHTSAIL_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.LIGHTSAIL_ACCESS_KEY_ID!,
        secretAccessKey: process.env.LIGHTSAIL_SECRET_ACCESS_KEY!
    }
});

// Get environment variables from .env file
function getContainerEnvVars(): Record<string, string> {
    const envVars: Record<string, string> = {};
    
    // Read .env file directly
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const envLines = envFile.split('\n');

    for (const line of envLines) {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) continue;
        
        // Parse key-value pairs
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const [, key, value] = match;
            const trimmedKey = key.trim();
            // Skip Lightsail credentials and empty values
            if (!trimmedKey.startsWith('LIGHTSAIL_') && value) {
                // Remove quotes if present
                const cleanValue = value.trim().replace(/^["'](.*)["']$/, '$1');
                envVars[trimmedKey] = cleanValue;
            }
        }
    }

    // Ensure critical variables are set
    const criticalVars = [
        'NEXT_PUBLIC_APP_URL',
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET',
        'DATABASE_URL'
    ];

    for (const key of criticalVars) {
        if (!envVars[key]) {
            console.warn(`Warning: Critical environment variable ${key} is not set`);
        }
    }

    return envVars;
}

async function deployToLightsail() {
    try {
        console.log('Starting deployment to AWS Lightsail...');

        // Create or update the container service
        try {
            console.log('Creating container service...');
            await lightsail.send(new CreateContainerServiceCommand({
                serviceName,
                power: 'micro',
                scale: 1
            }));
        } catch (error: any) {
            if (error.name === 'InvalidInputException' && error.message.includes('already exists')) {
                console.log('Container service already exists, updating...');
                await lightsail.send(new UpdateContainerServiceCommand({
                    serviceName,
                    power: 'micro',
                    scale: 1
                }));
            } else {
                throw error;
            }
        }

        // Deploy the container
        console.log('Creating deployment...');
        if (!process.env.DOPPLER_TOKEN) {
            console.error('Error: DOPPLER_TOKEN is not set in the environment.');
            process.exit(1);
        }
        const envVars = { DOPPLER_TOKEN: process.env.DOPPLER_TOKEN! };
        console.log('Deploying with DOPPLER_TOKEN');
        
        if (!(process.env.DOCKER_IMAGE_NAME && process.env.DOCKER_IMAGE_TAG)) {
            console.error('Error: DOCKER_IMAGE_NAME and/or DOCKER_IMAGE_TAG is not set in the environment.');
            process.exit(1);
        }
        const image = `${process.env.DOCKER_IMAGE_NAME}:${process.env.DOCKER_IMAGE_TAG}`;

        await lightsail.send(new CreateContainerServiceDeploymentCommand({
            serviceName,
            containers: {
                [containerName]: {
                    image: image,
                    environment: envVars,
                    ports: {
                        '3000': 'HTTP'
                    }
                }
            },
            publicEndpoint: {
                containerName,
                containerPort: 3000,
                healthCheck: {
                    healthyThreshold: 2,
                    unhealthyThreshold: 2,
                    timeoutSeconds: 2,
                    intervalSeconds: 5,
                    path: '/',
                    successCodes: '200-499'
                }
            }
        }));

        // After deployment initiation, add polling for deployment status
        console.log('Deployment initiated successfully!');
        console.log('Waiting for the container service to become READY...');
        await waitForDeployment(serviceName);

    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

// Add the waitForDeployment function at the end of the file before calling deployToLightsail
async function waitForDeployment(serviceName: string) {
    console.log('Polling Lightsail container service status...');
    while (true) {
        try {
            const response = await lightsail.send(new GetContainerServicesCommand({ serviceName }));
            if (response.containerServices && response.containerServices.length > 0) {
                const state = response.containerServices[0].state;
                console.log(`Current state: ${state}`);
                if (state === 'READY' || state === 'RUNNING') {
                    console.log('Container service is running. Deployment complete.');
                    break;
                } else {
                    console.log('Deployment in progress. Waiting 15 seconds...');
                }
            } else {
                console.error('Unable to retrieve container service status.');
            }
        } catch (err) {
            console.error('Error fetching container service status:', err);
        }
        await new Promise(resolve => setTimeout(resolve, 15000));
    }
}

// Call the deploy function
deployToLightsail(); 