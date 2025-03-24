const fs = require('fs').promises;
const path = require('path');

async function extractSqlObjects(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const objects = {
        tables: new Set(),
        views: new Set()
    };

    // Match CREATE TABLE statements
    const tableMatches = content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(;]+)/gi);
    for (const match of tableMatches) {
        const tableName = match[1].replace(/["'`]/g, '').trim();
        objects.tables.add(tableName);
    }

    // Match CREATE VIEW statements
    const viewMatches = content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(;]+)/gi);
    for (const match of viewMatches) {
        const viewName = match[1].replace(/["'`]/g, '').trim();
        objects.views.add(viewName);
    }

    // Match CREATE MATERIALIZED VIEW statements
    const matViewMatches = content.matchAll(/CREATE\s+MATERIALIZED\s+VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(;]+)/gi);
    for (const match of matViewMatches) {
        const viewName = match[1].replace(/["'`]/g, '').trim();
        objects.views.add(viewName + ' (materialized)');
    }

    return objects;
}

async function generateTree(startPath, indent = '', isLast = true) {
    const baseName = path.basename(startPath);
    let treeOutput = '';

    // Skip node_modules and hidden directories
    if (baseName.startsWith('.') || baseName === 'node_modules') {
        return '';
    }

    const stats = await fs.stat(startPath);
    const prefix = indent + (isLast ? '└── ' : '├── ');

    if (stats.isDirectory()) {
        // Read directory contents
        const items = await fs.readdir(startPath);
        const filteredItems = items
            .filter(item => !item.startsWith('.'))
            .filter(item => item.endsWith('.sql') || fs.stat(path.join(startPath, item)).then(stat => stat.isDirectory()));

        // If directory has no SQL files (directly or in subdirs), skip it
        const hasSqlFiles = await hasAnySqlFiles(startPath);
        if (!hasSqlFiles) {
            return '';
        }

        // Add directory name
        treeOutput += prefix + baseName + '/\n';

        // Sort items: directories first, then files
        const sortedItems = [];
        for (const item of filteredItems) {
            const fullPath = path.join(startPath, item);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory() || item.endsWith('.sql')) {
                sortedItems.push({
                    name: item,
                    isDirectory: stat.isDirectory(),
                    size: stat.size,
                    path: fullPath
                });
            }
        }

        sortedItems.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
                return a.name.localeCompare(b.name);
            }
            return b.isDirectory - a.isDirectory;
        });

        // Process each item
        for (let i = 0; i < sortedItems.length; i++) {
            const item = sortedItems[i];
            const newIndent = indent + (isLast ? '    ' : '│   ');
            const itemIsLast = i === sortedItems.length - 1;

            if (item.isDirectory) {
                treeOutput += await generateTree(item.path, newIndent, itemIsLast);
            } else if (item.name.endsWith('.sql')) {
                // Add file with size
                const sizeStr = formatSize(item.size);
                treeOutput += `${newIndent}${itemIsLast ? '└── ' : '├── '}${item.name} (${sizeStr})\n`;
                
                // Extract and add SQL objects
                try {
                    const objects = await extractSqlObjects(item.path);
                    if (objects.tables.size > 0) {
                        const tableIndent = newIndent + (itemIsLast ? '    ' : '│   ');
                        treeOutput += `${tableIndent}├── Tables:\n`;
                        const tables = Array.from(objects.tables).sort();
                        tables.forEach((table, idx) => {
                            const isLastTable = idx === tables.length - 1 && objects.views.size === 0;
                            treeOutput += `${tableIndent}${isLastTable ? '└── ' : '├── '}${table}\n`;
                        });
                    }
                    if (objects.views.size > 0) {
                        const viewIndent = newIndent + (itemIsLast ? '    ' : '│   ');
                        treeOutput += `${viewIndent}${objects.tables.size > 0 ? '├── ' : '└── '}Views:\n`;
                        const views = Array.from(objects.views).sort();
                        views.forEach((view, idx) => {
                            const isLastView = idx === views.length - 1;
                            treeOutput += `${viewIndent}${isLastView ? '└── ' : '├── '}${view}\n`;
                        });
                    }
                } catch (error) {
                    console.error(`Error parsing ${item.name}:`, error);
                }
            }
        }
    }

    return treeOutput;
}

async function hasAnySqlFiles(dirPath) {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
            const hasSql = await hasAnySqlFiles(fullPath);
            if (hasSql) return true;
        } else if (item.endsWith('.sql')) {
            return true;
        }
    }
    return false;
}

function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
}

async function main() {
    try {
        const rootDir = path.join(__dirname, '..');
        const treeOutput = '.\n' + await generateTree(rootDir);
        
        // Save to file
        const outputFile = path.join(rootDir, 'sql-tree.txt');
        await fs.writeFile(outputFile, treeOutput);
        console.log(`SQL tree structure saved to ${outputFile}`);
        
        // Also print to console
        console.log('\nSQL Files Tree:');
        console.log(treeOutput);
    } catch (error) {
        console.error('Error generating tree:', error);
        process.exit(1);
    }
}

main(); 