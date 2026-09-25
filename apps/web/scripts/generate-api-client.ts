import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import {
    fetchAndProcessOpenApiSpec,
    saveOpenApiSpec
} from '../lib/openapi-fetcher';

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const MIGRATIONS_TABLE_NAME = 'supabase_migrations';
const TABLES_TO_EXCLUDE = [MIGRATIONS_TABLE_NAME, 'pgsodium_key', 'pgsodium_masks'];
const PATHS_TO_EXCLUDE = ['/rpc/show_config', '/rpc/get_status']; // Renamed for clarity
const TAGS_TO_EXCLUDE: string[] = []; // Add any specific tags to always exclude

async function main() {
    const tempSpecPath = path.resolve(__dirname, 'temp-openapi-spec.json');
    const generatedClientPath = path.resolve(__dirname, '../lib/generated-api-client/index.ts');
    const generatedClientDir = path.dirname(generatedClientPath);
    let errorOccurred = false;

    try {
        console.log('[GeneratorScript] Fetching and processing OpenAPI spec...');
        const processedSpec = await fetchAndProcessOpenApiSpec();

        if (!processedSpec) {
            throw new Error('Failed to fetch and process OpenAPI spec. Check logs from openapi-fetcher.');
        }
        console.log('[GeneratorScript] Successfully fetched and processed OpenAPI spec.');

        // Save the processed spec locally for openapi-typescript CLI
        console.log(`[GeneratorScript] Saving processed spec to ${tempSpecPath}...`);
        saveOpenApiSpec(processedSpec, tempSpecPath);
        console.log('[GeneratorScript] Processed spec saved.');

        // Generate API Client types using openapi-typescript
        console.log(`[GeneratorScript] Generating API client types using openapi-typescript to ${generatedClientPath}...`);
        if (!fs.existsSync(generatedClientDir)) {
            fs.mkdirSync(generatedClientDir, { recursive: true });
        }
        const openapiTsCommand = `pnpm exec openapi-typescript ${tempSpecPath} --output "${generatedClientPath}"`;
        console.log(`[GeneratorScript] Executing: ${openapiTsCommand}`);
        execSync(openapiTsCommand, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
        console.log('[GeneratorScript] Successfully generated API client types.');

    } catch (error) {
        console.error('Error during API client generation process:', error);
        errorOccurred = true;
    } finally {
        if (fs.existsSync(tempSpecPath)) {
            if (!errorOccurred) {
                console.log(`Cleaning up temporary spec file: ${tempSpecPath}`);
                fs.unlinkSync(tempSpecPath);
            } else {
                console.log(`Error occurred. Preserving temporary spec file for inspection: ${tempSpecPath}`);
            }
        }
        if (errorOccurred) {
            process.exit(1);
        }
    }
}

main().catch(err => {
    console.error('Unhandled error in main function:', err);
    process.exit(1);
}); 