const fs = require('fs').promises;
const path = require('path');

async function combineFiles() {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const outputFile = path.join(__dirname, '..', 'combined_migrations.sql');
    let combinedContent = '-- Combined Migrations\n-- Generated: ' + new Date().toISOString() + '\n\n';

    try {
        // Get all directories starting with numbers (e.g., 100_core)
        const dirs = await fs.readdir(migrationsDir);
        const migrationDirs = dirs
            .filter(dir => /^\d+/.test(dir))
            .sort((a, b) => {
                const numA = parseInt(a.split('_')[0]);
                const numB = parseInt(b.split('_')[0]);
                return numA - numB;
            });

        // Process each directory
        for (const dir of migrationDirs) {
            const fullDirPath = path.join(migrationsDir, dir);
            const dirStat = await fs.stat(fullDirPath);

            if (!dirStat.isDirectory()) continue;

            // Add section header
            combinedContent += `\n--\n-- Section: ${dir}\n--\n\n`;

            // Get all SQL files in the directory
            const files = await fs.readdir(fullDirPath);
            const sqlFiles = files
                .filter(file => file.endsWith('.sql'))
                .sort((a, b) => {
                    const numA = parseInt(a.split('_')[0]);
                    const numB = parseInt(b.split('_')[0]);
                    return numA - numB;
                });

            // Combine files in order
            for (const file of sqlFiles) {
                const filePath = path.join(fullDirPath, file);
                const content = await fs.readFile(filePath, 'utf8');
                
                combinedContent += `--\n-- File: ${dir}/${file}\n--\n\n`;
                combinedContent += content.trim() + '\n\n';
            }
        }

        // Write combined content to file
        await fs.writeFile(outputFile, combinedContent);
        console.log(`Successfully combined migrations into ${outputFile}`);

    } catch (error) {
        console.error('Error combining files:', error);
        process.exit(1);
    }
}

// Create scripts directory if it doesn't exist
fs.mkdir(path.join(__dirname, '..', 'scripts'), { recursive: true })
    .then(() => combineFiles())
    .catch(error => {
        console.error('Error creating scripts directory:', error);
        process.exit(1);
    }); 