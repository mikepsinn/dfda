import { Lightsail } from '@aws-sdk/client-lightsail';

export async function provisionTenant(config: { region: string }) {
  const lightsail = new Lightsail({ region: config.region });

  // Check current service state
  const services = await lightsail.getContainerServices({
    serviceName: 'dfda-app'
  });
  const service = services.containerServices?.[0];
  
  if (!service) {
    throw new Error('Container service not found');
  }

  if (service.state === 'DEPLOYING') {
    console.log('A deployment is already in progress. Please wait for it to complete.');
    return {
      serviceUrl: service.url
    };
  }

  // Filter out undefined values from process.env
  const envVars: Record<string, string> = {};
  Object.entries(process.env).forEach(([key, value]) => {
    if (value !== undefined) {
      envVars[key] = value;
    }
  });

  console.log('Deploying application...');
  const deployment = await lightsail.createContainerServiceDeployment({
    serviceName: 'dfda-app',
    containers: {
      app: {
        image: 'dfda-web:deploy',
        environment: envVars,
        ports: {
          3000: 'HTTP'
        }
      }
    },
  });

  console.log('Deployment complete!');
  return {
    serviceUrl: service.url
  };
} 