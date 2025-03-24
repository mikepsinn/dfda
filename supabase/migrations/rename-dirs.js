const fs = require('fs');
const path = require('path');

// Get all directories in migrations folder
const migrationsDir = __dirname;
const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });

// Process only directories and skip files
const dirs = entries
    .filter(entry => entry.isDirectory())
    // Only process dirs that start with numbers
    .filter(dir => /^\d+_/.test(dir.name))
    .map(dir => ({
        oldName: dir.name,
        // Remove the numeric prefix and underscore
        newName: dir.name.replace(/^\d+_/, '')
    }));

// Print planned changes
console.log('Will rename the following directories:');
dirs.forEach(({ oldName, newName }) => {
    console.log(`  ${oldName} -> ${newName}`);
});

// Confirm with user
console.log('\nProceed with renaming? (y/n)');
process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    if (answer === 'y') {
        // Perform renames
        dirs.forEach(({ oldName, newName }) => {
            const oldPath = path.join(migrationsDir, oldName);
            const newPath = path.join(migrationsDir, newName);
            
            try {
                fs.renameSync(oldPath, newPath);
                console.log(`✓ Renamed ${oldName} to ${newName}`);
            } catch (err) {
                console.error(`✗ Failed to rename ${oldName}: ${err.message}`);
            }
        });
        console.log('\nDone!');
    } else {
        console.log('Aborted.');
    }
    process.exit();
}); 