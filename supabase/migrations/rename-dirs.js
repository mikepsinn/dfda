const fs = require('fs');
const path = require('path');

// Get all entries in migrations folder and subdirectories
const migrationsDir = __dirname;

function getAllFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];

    entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Recursively get files from subdirectories
            files = files.concat(getAllFiles(fullPath));
        } else if (entry.isFile()) {
            let shouldRename = false;
            let newName = entry.name;

            // Skip timestamp-prefixed files (20250321...)
            if (!/^20\d{12}_/.test(entry.name)) {
                // Remove numeric prefixes with optional letter suffixes (e.g., 211a_)
                if (/^\d+[a-z]?_/.test(entry.name)) {
                    shouldRename = true;
                    newName = newName.replace(/^\d+[a-z]?_/, '');
                }
                
                // Remove _view suffix before .sql
                if (newName.endsWith('_view.sql')) {
                    shouldRename = true;
                    newName = newName.replace('_view.sql', '.sql');
                }
            }

            if (shouldRename) {
                files.push({
                    oldPath: fullPath,
                    oldName: entry.name,
                    newName: newName
                });
            }
        }
    });

    return files;
}

const files = getAllFiles(migrationsDir);

if (files.length === 0) {
    console.log('No files found that need renaming.');
    process.exit(0);
}

// Print and execute changes
console.log('Renaming the following files:');
files.forEach(({ oldPath, oldName, newName }) => {
    const newPath = path.join(path.dirname(oldPath), newName);
    try {
        fs.renameSync(oldPath, newPath);
        console.log(`✓ ${path.relative(migrationsDir, oldPath)} -> ${newName}`);
    } catch (err) {
        console.error(`✗ Failed to rename ${oldName}: ${err.message}`);
    }
}); 