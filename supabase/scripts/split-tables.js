const fs = require('fs').promises;
const path = require('path');

async function splitFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const schema = path.dirname(filePath).split(path.sep).pop();
    
    // Find all SQL statements
    const objects = [];
    
    // Object type definitions with their regex patterns
    const objectTypes = [
        {
            type: 'table',
            regex: /CREATE\s+TABLE\s+(\w+)\.(\w+)\s*\(([\s\S]*?)\);/gi,
            nameIndex: 2,
            suffix: '.table'
        },
        {
            type: 'view',
            regex: /CREATE(?:\s+OR\s+REPLACE)?\s+VIEW\s+(\w+)\.(\w+)\s+AS([\s\S]*?);(?=\s*$|\s*--|\s*CREATE|$)/gi,
            nameIndex: 2,
            suffix: '.view'
        },
        {
            type: 'function',
            regex: /CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\s+(\w+)\.(\w+)[\s\S]*?LANGUAGE\s+\w+(?:\s+VOLATILE|\s+STABLE|\s+IMMUTABLE)?\s*;(?=\s*$|\s*--|\s*CREATE|$)/gi,
            nameIndex: 2,
            suffix: '.function'
        },
        {
            type: 'procedure',
            regex: /CREATE(?:\s+OR\s+REPLACE)?\s+PROCEDURE\s+(\w+)\.(\w+)[\s\S]*?LANGUAGE\s+\w+(?:\s+VOLATILE|\s+STABLE|\s+IMMUTABLE)?\s*;(?=\s*$|\s*--|\s*CREATE|$)/gi,
            nameIndex: 2,
            suffix: '.procedure'
        },
        {
            type: 'trigger',
            regex: /CREATE(?:\s+OR\s+REPLACE)?\s+TRIGGER\s+(\w+)\s+(?:BEFORE|AFTER|INSTEAD\s+OF)\s+(?:INSERT|UPDATE|DELETE)[\s\S]*?ON\s+(\w+)\.(\w+)[\s\S]*?EXECUTE\s+(?:FUNCTION|PROCEDURE)[\s\S]*?;(?=\s*$|\s*--|\s*CREATE|$)/gi,
            nameIndex: 1,
            tableIndex: 3,
            suffix: '.trigger'
        },
        {
            type: 'type',
            regex: /CREATE\s+TYPE\s+(\w+)\.(\w+)\s+AS[\s\S]*?;(?=\s*$|\s*--|\s*CREATE|$)/gi,
            nameIndex: 2,
            suffix: '.type'
        },
        {
            type: 'policy',
            regex: /CREATE\s+POLICY\s+(\w+)\s+ON\s+(\w+)\.(\w+)[\s\S]*?;(?=\s*$|\s*--|\s*CREATE|$)/gi,
            nameIndex: 1,
            tableIndex: 3,
            suffix: '.policy'
        },
        {
            type: 'seed',
            regex: /INSERT\s+INTO\s+(\w+)\.(\w+)[\s\S]*?;(?=\s*$|\s*--|\s*(?:INSERT|CREATE|ALTER)|$)/gi,
            nameIndex: 2,
            groupByTable: true,
            suffix: '.seed'
        },
        {
            type: 'alter',
            regex: /ALTER\s+TABLE\s+(\w+)\.(\w+)\s+[^;]*;(?=\s*$|\s*--|\s*(?:INSERT|CREATE|ALTER)|$)/gi,
            nameIndex: 2,
            groupByTable: true,
            suffix: '.alter'
        }
    ];
    
    // Process each object type
    for (const def of objectTypes) {
        let match;
        const groupedContent = new Map(); // For grouping statements by table
        
        while ((match = def.regex.exec(content)) !== null) {
            const objectSchema = match[1];
            // For triggers and policies, use a different naming strategy
            const objectName = def.tableIndex ? 
                `${match[def.tableIndex]}_${match[def.nameIndex]}` : // table_triggername or table_policyname
                match[def.nameIndex];
            
            if (objectSchema === schema || (def.type === 'trigger' || def.type === 'policy')) {
                if (def.groupByTable) {
                    // Group statements by table
                    if (!groupedContent.has(objectName)) {
                        groupedContent.set(objectName, {
                            name: objectName,
                            content: [],
                            type: def.type
                        });
                    }
                    groupedContent.get(objectName).content.push(match[0]);
                } else {
                    objects.push({
                        name: objectName,
                        content: match[0],
                        type: def.type,
                        originalName: match[def.nameIndex],
                        suffix: def.suffix
                    });
                }
            }
        }
        
        // Add grouped content to objects
        if (def.groupByTable) {
            for (const [_, obj] of groupedContent) {
                objects.push({
                    ...obj,
                    content: obj.content.join('\n\n'),
                    suffix: def.suffix
                });
            }
        }
    }
    
    // If we found multiple objects, split them
    if (objects.length > 1) {
        console.log(`Splitting ${filePath} into ${objects.length} files...`);
        
        // Create individual files for each object
        for (const obj of objects) {
            // Choose target directory based on type
            let targetDir = path.dirname(filePath);
            if (obj.type === 'trigger' || obj.type === 'policy') {
                targetDir = path.join(targetDir, obj.type + 's');
                await fs.mkdir(targetDir, { recursive: true });
            } else if (obj.type === 'seed') {
                targetDir = path.join(targetDir, 'seeds');
                await fs.mkdir(targetDir, { recursive: true });
            } else if (obj.type === 'alter') {
                targetDir = path.join(targetDir, 'alters');
                await fs.mkdir(targetDir, { recursive: true });
            }
            
            const newPath = path.join(targetDir, `${obj.name}${obj.suffix}.sql`);
            
            // Add header comment
            let headerComment = `-- ${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}: ${schema}.${obj.name}`;
            if (obj.type === 'trigger' || obj.type === 'policy') {
                headerComment += `\n-- Original name: ${obj.originalName}`;
            } else if (obj.type === 'seed') {
                headerComment += `\n-- Seed data for ${schema}.${obj.name}`;
            } else if (obj.type === 'alter') {
                headerComment += `\n-- Alter statements for ${schema}.${obj.name}`;
            }
            
            const fileContent = `${headerComment}\n\n${obj.content}\n`;
            
            await fs.writeFile(newPath, fileContent);
            console.log(`Created ${newPath} (${obj.type})`);
        }
        
        // Rename original file to .bak
        const bakPath = filePath + '.bak';
        await fs.rename(filePath, bakPath);
        console.log(`Renamed original file to ${bakPath}`);
    }
}

async function processDirectory(directory) {
    const files = await fs.readdir(directory, { withFileTypes: true });
    
    for (const file of files) {
        const fullPath = path.join(directory, file.name);
        
        if (file.isDirectory()) {
            await processDirectory(fullPath);
        } else if (file.name.endsWith('.sql') && !file.name.endsWith('.bak')) {
            await splitFile(fullPath);
        }
    }
}

// Start processing from schema directory
processDirectory('schema')
    .then(() => console.log('Done!'))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    }); 