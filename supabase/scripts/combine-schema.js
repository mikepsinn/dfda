const fs = require('fs').promises;
const path = require('path');

async function readSchemaFiles(directory) {
    const files = await fs.readdir(directory, { withFileTypes: true });
    const schemaFiles = [];

    for (const file of files) {
        const fullPath = path.join(directory, file.name);
        if (file.isDirectory() && !file.name.startsWith('.')) {
            const subFiles = await readSchemaFiles(fullPath);
            schemaFiles.push(...subFiles);
        } else if (file.isFile() && file.name.endsWith('.sql')) {
            const content = await fs.readFile(fullPath, 'utf8');
            schemaFiles.push({
                path: fullPath,
                content,
                isSchema: file.name === 'schema.sql'
            });
        }
    }

    // Sort schema.sql files first
    return schemaFiles.sort((a, b) => {
        if (a.isSchema && !b.isSchema) return -1;
        if (!a.isSchema && b.isSchema) return 1;
        return 0;
    });
}

async function createMigration() {
    try {
        const schemaDir = path.join(__dirname, '..', 'schema');
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        
        // Start with schema creation
        let combinedContent = '-- Combined schema migration\n\n';
        combinedContent += `-- Generated at: ${new Date().toISOString()}\n\n`;
        combinedContent += `-- Create schemas\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS cohort;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS commerce;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS core;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS finance;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS global;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS logistics;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS medical_ref;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS models;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS oauth2;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS personal;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS reference;\n`;
        combinedContent += `CREATE SCHEMA IF NOT EXISTS scheduling;\n\n`;
        
        // Read all schema files
        const schemaFiles = await readSchemaFiles(schemaDir);
        
        // Add schema files
        for (const file of schemaFiles) {
            const relativePath = path.relative(schemaDir, file.path);
            const [domain] = relativePath.split(path.sep);
            combinedContent += `\n-- Schema: ${domain}, File: ${path.basename(file.path)}\n`;
            combinedContent += file.content + '\n';
        }
        
        // Create migrations directory if it doesn't exist
        await fs.mkdir(migrationsDir, { recursive: true });
        
        // Write combined file
        const migrationPath = path.join(migrationsDir, `${timestamp}_initial_schema.sql`);
        await fs.writeFile(migrationPath, combinedContent);
        
        console.log(`Created migration at ${migrationPath}`);
    } catch (error) {
        console.error('Error creating migration:', error);
    }
}

createMigration(); 