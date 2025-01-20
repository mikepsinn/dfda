import { Lightsail } from '@aws-sdk/client-lightsail';
import { RDS, waitUntilDBInstanceAvailable } from '@aws-sdk/client-rds';
import { generateSecureSecret } from './utils';

export async function provisionTenant(config: { region: string }) {
  const lightsail = new Lightsail({ region: config.region });
  const rds = new RDS({ region: config.region });

  console.log('Creating database...');
  const dbPassword = await generateSecureSecret();
  const dbInstance = await rds.createDBInstance({
    DBInstanceIdentifier: 'dfda-db',
    Engine: 'postgres',
    DBName: 'dfda',
    DBInstanceClass: 'db.t3.micro',
    MasterUsername: 'postgres',
    MasterUserPassword: dbPassword,
    AllocatedStorage: 20,
    PubliclyAccessible: false,
    VpcSecurityGroupIds: [],
  });

  console.log('Creating container service...');
  const containerService = await lightsail.createContainerService({
    serviceName: 'dfda-app',
    power: 'micro',
    scale: 1,
  });

  // Wait for DB to be available
  console.log('Waiting for database to be ready...');
  await waitUntilDBInstanceAvailable({
    client: rds,
    maxWaitTime: 600,
    minDelay: 15,
    maxDelay: 30
  }, {
    DBInstanceIdentifier: 'dfda-db'
  });

  const dbEndpoint = dbInstance.DBInstance?.Endpoint?.Address;
  if (!dbEndpoint) {
    throw new Error('Database endpoint not available');
  }

  console.log('Deploying application...');
  const deployment = await lightsail.createContainerServiceDeployment({
    serviceName: 'dfda-app',
    containers: {
      app: {
        image: 'dfda-web:latest',
        environment: {
          DATABASE_URL: `postgresql://postgres:${dbPassword}@${dbEndpoint}:5432/dfda`,
          ...process.env // Use all current env vars
        },
        ports: {
          3000: 'HTTP'
        }
      }
    },
  });

  console.log('Deployment complete!');
  return {
    serviceUrl: containerService.containerService?.url,
    dbEndpoint
  };
} 