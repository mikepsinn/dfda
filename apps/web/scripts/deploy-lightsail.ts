import { LightsailClient, CreateContainerServiceCommand, UpdateContainerServiceCommand, CreateContainerServiceDeploymentCommand } from "@aws-sdk/client-lightsail";
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
        const envVars = { DOPPLER_TOKEN: process.env.DOPPLER_TOKEN! };
        console.log('Deploying with DOPPLER_TOKEN');
        
        await lightsail.send(new CreateContainerServiceDeploymentCommand({
            serviceName,
            containers: {
                [containerName]: {
                    image: 'curedao/dfda-web:1.0.0',
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

        console.log('Deployment initiated successfully!');
        console.log('Note: It may take a few minutes for the deployment to complete.');
        console.log('You can check the status in the AWS Lightsail Console.');

    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

deployToLightsail(); 