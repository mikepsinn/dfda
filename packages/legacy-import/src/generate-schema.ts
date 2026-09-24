#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface Config {
  excludePattern?: string;
  schemaPath?: string;
}

function generateSchema(config: Config = {}) {
  const {
    excludePattern = '',
    schemaPath = path.join(__dirname, '../prisma/schema.prisma')
  } = config;

  // Run introspection command
  console.log('🔍 Introspecting database...');
  execSync('prisma db pull --force', { stdio: 'inherit' });

  if (!excludePattern) {
    console.log('✅ Schema generated successfully!');
    return;
  }

  // Read the generated schema
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const regex = new RegExp(excludePattern);

  // Split schema into model definitions
  const models = schema.split('\nmodel ');
  const header = models[0];
  const modelDefinitions = models.slice(1);

  // Filter out models that match the exclude pattern
  const filteredModels = modelDefinitions.filter(model => {
    const modelName = model.split(' ')[0];
    return !regex.test(modelName);
  });

  // Reconstruct the schema
  const newSchema = [
    header,
    ...filteredModels.map(model => `\nmodel ${model}`)
  ].join('');

  // Write the filtered schema back to file
  fs.writeFileSync(schemaPath, newSchema);
  
  console.log('✅ Schema generated successfully with excluded tables!');
}

// Handle CLI arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  const excludePattern = args[0];
  
  if (!excludePattern) {
    console.log('Usage: generate-schema <exclude-pattern>');
    console.log('Example: generate-schema "^temp_|_backup$"');
    process.exit(1);
  }

  generateSchema({ excludePattern });
}

export { generateSchema }; 