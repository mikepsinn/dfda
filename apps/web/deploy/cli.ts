import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { provisionTenant } from './provision-tenant';
import { listTenants } from './list-tenants';
import { deleteTenant } from './delete-tenant';
import { updateTenant } from './update-tenant';
import { backupTenant } from './backup-tenant';
import { restoreTenant } from './restore-tenant';
import { migrateTenant } from './migrate-tenant';
import { monitorTenants } from './monitor-tenants';

yargs(hideBin(process.argv))
  .command('provision', 'Provision a new tenant', (yargs) => {
    return yargs
      .option('name', {
        alias: 'n',
        type: 'string',
        description: 'Tenant name',
        demandOption: true,
      })
      .option('domain', {
        alias: 'd',
        type: 'string',
        description: 'Tenant domain',
        demandOption: true,
      })
      .option('region', {
        alias: 'r',
        type: 'string',
        description: 'AWS region',
        default: 'us-east-1',
      });
  }, async (argv) => {
    try {
      const result = await provisionTenant({
        name: argv.name,
        domain: argv.domain,
        region: argv.region,
        dbHost: `${argv.name}-db.${argv.region}.rds.amazonaws.com`,
        dbName: `${argv.name}_db`,
      });
      console.log('Tenant provisioned successfully:', result);
    } catch (error) {
      console.error('Failed to provision tenant:', error);
      process.exit(1);
    }
  })
  .command('list', 'List all tenants', () => {}, async () => {
    try {
      const tenants = await listTenants();
      console.table(tenants);
    } catch (error) {
      console.error('Failed to list tenants:', error);
      process.exit(1);
    }
  })
  .command('delete', 'Delete a tenant', (yargs) => {
    return yargs
      .option('name', {
        alias: 'n',
        type: 'string',
        description: 'Tenant name',
        demandOption: true,
      })
      .option('region', {
        alias: 'r',
        type: 'string',
        description: 'AWS region',
        default: 'us-east-1',
      });
  }, async (argv) => {
    try {
      await deleteTenant(argv.name, argv.region);
      console.log('Tenant deleted successfully');
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      process.exit(1);
    }
  })
  .command('update', 'Update a tenant', (yargs) => {
    return yargs
      .option('name', {
        alias: 'n',
        type: 'string',
        description: 'Tenant name',
        demandOption: true,
      })
      .option('region', {
        alias: 'r',
        type: 'string',
        description: 'AWS region',
        default: 'us-east-1',
      })
      .option('scale', {
        alias: 's',
        type: 'number',
        description: 'Number of container instances',
      })
      .option('power', {
        alias: 'p',
        type: 'string',
        description: 'Container power (micro, small, medium, large)',
      });
  }, async (argv) => {
    try {
      await updateTenant(argv.name, argv.region, {
        scale: argv.scale,
        power: argv.power,
      });
      console.log('Tenant updated successfully');
    } catch (error) {
      console.error('Failed to update tenant:', error);
      process.exit(1);
    }
  })
  .command('backup', 'Backup a tenant', (yargs) => {
    return yargs
      .option('name', {
        alias: 'n',
        type: 'string',
        description: 'Tenant name',
        demandOption: true,
      })
      .option('region', {
        alias: 'r',
        type: 'string',
        description: 'AWS region',
        default: 'us-east-1',
      });
  }, async (argv) => {
    try {
      const backup = await backupTenant(argv.name, argv.region);
      console.log('Tenant backup created:', backup);
    } catch (error) {
      console.error('Failed to backup tenant:', error);
      process.exit(1);
    }
  })
  .command('restore', 'Restore a tenant', (yargs) => {
    return yargs
      .option('name', {
        alias: 'n',
        type: 'string',
        description: 'Tenant name',
        demandOption: true,
      })
      .option('backup', {
        alias: 'b',
        type: 'string',
        description: 'Backup ID',
        demandOption: true,
      })
      .option('region', {
        alias: 'r',
        type: 'string',
        description: 'AWS region',
        default: 'us-east-1',
      });
  }, async (argv) => {
    try {
      await restoreTenant(argv.name, argv.backup, argv.region);
      console.log('Tenant restored successfully');
    } catch (error) {
      console.error('Failed to restore tenant:', error);
      process.exit(1);
    }
  })
  .command('migrate', 'Run database migrations for a tenant', (yargs) => {
    return yargs
      .option('name', {
        alias: 'n',
        type: 'string',
        description: 'Tenant name',
        demandOption: true,
      })
      .option('region', {
        alias: 'r',
        type: 'string',
        description: 'AWS region',
        default: 'us-east-1',
      });
  }, async (argv) => {
    try {
      await migrateTenant(argv.name, argv.region);
      console.log('Tenant migrations completed successfully');
    } catch (error) {
      console.error('Failed to run migrations:', error);
      process.exit(1);
    }
  })
  .command('monitor', 'Monitor tenant health and metrics', (yargs) => {
    return yargs
      .option('region', {
        alias: 'r',
        type: 'string',
        description: 'AWS region',
        default: 'us-east-1',
      });
  }, async (argv) => {
    try {
      await monitorTenants(argv.region);
    } catch (error) {
      console.error('Failed to monitor tenants:', error);
      process.exit(1);
    }
  })
  .demandCommand(1, 'You need to specify a command')
  .strict()
  .help()
  .argv; 