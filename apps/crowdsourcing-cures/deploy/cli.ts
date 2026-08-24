import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { provisionTenant } from './provision-tenant';

yargs(hideBin(process.argv))
  .command('deploy', 'Deploy the application', (yargs) => {
    return yargs
      .option('region', {
        alias: 'r',
        type: 'string',
        description: 'AWS region',
        default: 'us-east-1',
      });
  }, async (argv) => {
    try {
      const result = await provisionTenant({
        region: argv.region,
      });
      console.log('Application deployed successfully!');
      console.log('Service URL:', result.serviceUrl);
    } catch (error) {
      console.error('Failed to deploy:', error);
      process.exit(1);
    }
  })
  .demandCommand(1, 'You need to specify a command')
  .strict()
  .help()
  .argv; 