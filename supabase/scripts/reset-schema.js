const { execSync } = require('child_process');
const path = require('path');

function runCommand(command) {
    try {
        console.log(`Running: ${command}`);
        const output = execSync(command, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..', '..')
        });
        return true;
    } catch (error) {
        console.error(`Command failed: ${command}`);
        console.error(error.message);
        return false;
    }
}

async function resetSchema() {
    // Generate migration
    if (!runCommand('pnpm db:generate-migration')) {
        console.error('Failed to generate migration');
        process.exit(1);
    }

    // Reset database
    if (!runCommand('pnpm db:reset')) {
        console.error('Failed to reset database');
        process.exit(1);
    }

    console.log('Schema reset completed successfully');
}

resetSchema(); 