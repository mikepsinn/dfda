const fs = require('fs');
const path = require('path');
const ignore = require('ignore');

// Function to read .gitignore and create an ignore filter
function getGitignoreFilter() {
    const ig = ignore();
    try {
        const gitignorePath = path.join(process.cwd(), '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            ig.add(gitignoreContent);
        }
    } catch (error) {
        console.warn('Warning: Could not read .gitignore file:', error.message);
    }
    return ig;
}

// Function to read .env file and extract variable names
function getEnvVariables(envPath) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const variables = [];
    
    envContent.split('\n').forEach(line => {
        // Skip comments and empty lines
        if (line.trim() && !line.startsWith('#')) {
            const match = line.match(/^([A-Za-z0-9_]+)=/);
            if (match) {
                variables.push(match[1]);
            }
        }
    });
    
    return variables;
}

// Function to recursively get all files in directory
function getAllFiles(dir, ig, fileList = [], rootDir = dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        // Get path relative to root directory for gitignore matching
        const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        
        if (!ig.ignores(relativePath)) {
            if (stat.isDirectory()) {
                fileList = getAllFiles(filePath, ig, fileList, rootDir);
            } else if (stat.isFile()) {
                fileList.push(filePath);
            }
        }
    });
    
    return fileList;
}

// Function to check if a variable is used in a file
function checkFileForVariable(filePath, variable) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const patterns = [
            `process.env.${variable}`,  // Direct Node.js usage
            `env.${variable}`,          // Next.js env usage
            ...(filePath.includes('env') ? [`"${variable}"`, `'${variable}'`] : []) // Check raw variable name only in env files
        ];
        
        return patterns.some(pattern => content.includes(pattern));
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return false;
    }
}

// Function to check if a variable is used in the codebase
function isVariableUsed(variable, files) {
    return files.some(file => checkFileForVariable(file, variable));
}

// Main function
function findUnusedEnvVariables() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found');
        process.exit(1);
    }

    console.log('Reading .gitignore patterns...');
    const ig = getGitignoreFilter();

    console.log('Scanning files...');
    const files = getAllFiles(process.cwd(), ig);
    console.log(`Found ${files.length} files to check.`);

    const variables = getEnvVariables(envPath);
    const unusedVariables = [];
    const usedVariables = [];

    console.log(`\nChecking ${variables.length} environment variables for usage...`);

    variables.forEach((variable, index) => {
        process.stdout.write(`\rProgress: ${index + 1}/${variables.length}`);
        if (isVariableUsed(variable, files)) {
            usedVariables.push(variable);
        } else {
            unusedVariables.push(variable);
        }
    });

    // Clear the progress line
    process.stdout.write('\r' + ' '.repeat(50) + '\r');

    console.log('\nResults:');
    console.log('=========');
    console.log(`\nTotal variables: ${variables.length}`);
    console.log(`Used variables: ${usedVariables.length}`);
    console.log(`Potentially unused variables: ${unusedVariables.length}`);

    if (unusedVariables.length > 0) {
        console.log('\nPotentially unused variables:');
        console.log('============================');
        unusedVariables.forEach(variable => {
            console.log(`- ${variable}`);
        });
    }

    if (usedVariables.length > 0) {
        console.log('\nUsed variables:');
        console.log('===============');
        usedVariables.forEach(variable => {
            console.log(`- ${variable}`);
        });
    }
}

findUnusedEnvVariables(); 