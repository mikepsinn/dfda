import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { Lightsail } from '@aws-sdk/client-lightsail';
import { RDS } from '@aws-sdk/client-rds';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { generateSecureSecret } from './utils';

interface TenantConfig {
  name: string;
  domain: string;
  dbHost: string;
  dbName: string;
  region: string;
}

export type { TenantConfig };

export async function provisionTenant(config: TenantConfig) {
  const secrets = new SecretsManager({ region: config.region });
  const lightsail = new Lightsail({ region: config.region });
  const rds = new RDS({ region: config.region });

  console.log(`Provisioning tenant: ${config.name}`);

  // 1. Create RDS database
  const dbInstance = await rds.createDBInstance({
    DBInstanceIdentifier: `${config.name}-db`,
    Engine: 'postgres',
    DBName: config.dbName,
    DBInstanceClass: 'db.t3.micro',
    MasterUsername: 'postgres',
    MasterUserPassword: await generateSecureSecret(),
    AllocatedStorage: 20,
    PubliclyAccessible: false,
    VpcSecurityGroupIds: [],
    // Add other DB configuration as needed
  });

  // 2. Load and process environment template
  const envTemplate = yaml.load(fs.readFileSync('./deploy/env.template.yaml', 'utf8'));
  const processedEnv = processTemplate(envTemplate, config);

  // 3. Store secrets in AWS Secrets Manager
  for (const secret of processedEnv.secrets) {
    await secrets.createSecret({
      Name: secret.from,
      SecretString: generateSecureSecret(), // Implement this based on your security requirements
    });
  }

  // 4. Create Lightsail container service
  const containerService = await lightsail.createContainerService({
    serviceName: `${config.name}-service`,
    power: 'micro',
    scale: 1,
  });

  // 5. Deploy container with environment variables
  const deployment = await lightsail.createContainerServiceDeployment({
    serviceName: `${config.name}-service`,
    containers: {
      app: {
        image: 'dfda-web:latest',
        environment: await buildEnvironmentVariables(processedEnv, secrets),
        ports: {
          3000: 'HTTP'
        }
      }
    },
  });

  console.log(`Tenant provisioned successfully: ${config.name}`);
  return {
    serviceUrl: containerService.containerService?.url,
    dbEndpoint: dbInstance.DBInstance?.Endpoint?.Address,
  };
}

async function buildEnvironmentVariables(processedEnv: any, secrets: SecretsManager) {
  const env: Record<string, string> = {
    ...processedEnv.shared,
    ...processedEnv.tenant.config,
  };

  // Fetch secrets from AWS Secrets Manager
  for (const secret of processedEnv.secrets) {
    const value = await secrets.getSecretValue({ SecretId: secret.from });
    if (value.SecretString) {
      env[secret.name] = value.SecretString;
    }
  }

  return env;
}

function processTemplate(template: any, config: TenantConfig) {
  // Deep clone the template
  const processed = JSON.parse(JSON.stringify(template));

  // Replace template variables
  const replacements = {
    '{{TENANT_NAME}}': config.name,
    '{{TENANT_DOMAIN}}': config.domain,
    '{{TENANT_DB_HOST}}': config.dbHost,
    '{{TENANT_DB_NAME}}': config.dbName,
  };

  // Recursively process all string values in the template
  function processObject(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        for (const [pattern, value] of Object.entries(replacements)) {
          obj[key] = obj[key].replace(pattern, value);
        }
      } else if (typeof obj[key] === 'object') {
        processObject(obj[key]);
      }
    }
  }

  processObject(processed);
  return processed;
}

// Example usage:
// provisionTenant({
//   name: 'tenant1',
//   domain: 'tenant1.example.com',
//   dbHost: 'tenant1-db.xxxxx.region.rds.amazonaws.com',
//   dbName: 'tenant1_db',
//   region: 'us-east-1'
// }); 