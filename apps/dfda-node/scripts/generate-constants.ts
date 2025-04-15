import * as path from 'path';
import { generateConstantsFile } from './lib/generate-constants-util';
import type { Database } from '../lib/database.types'; // Adjust if needed
/// <reference path="../lib/database.types.ts" />
// import type { Database } from '../lib/database.types'; // Adjust path if needed

// Define specific types for better type safety when calling the generic function
type Schema = 'public';
type UnitTable = 'units';
type VariableCategoryTable = 'variable_categories';
type UnitCategoryTable = 'unit_categories';
// No longer need to explicitly define UnitRow here for the call
// type UnitRow = Database[Schema]['Tables'][UnitTable]['Row']; 

const UNITS_OUTPUT_PATH = path.resolve(__dirname, '../lib/constants/units.ts');
const VAR_CAT_OUTPUT_PATH = path.resolve(__dirname, '../lib/constants/variable-categories.ts');
const UNIT_CAT_OUTPUT_PATH = path.resolve(__dirname, '../lib/constants/unit-categories.ts');

async function main() {
    console.log('Generating constants...');

    // Generate Unit Constants
    console.log('\n--- Generating Unit Constants ---');
    await generateConstantsFile<Schema, UnitTable>({
        dbSchema: 'public',
        tableName: 'units',
        outputFilePath: UNITS_OUTPUT_PATH,
        rowTypeName: 'UnitRow',
        idsConstantName: 'UNIT_IDS',
        dataConstantName: 'UNITS_DATA',
        keyGenerationColumn: 'name',
        idColumn: 'id',
        orderByColumn: 'name',
        columnsToExclude: ['created_at', 'updated_at'],
        numericColumns: ['conversion_factor', 'conversion_offset']
    });

    // Generate Variable Category Constants
    console.log('\n--- Generating Variable Category Constants ---');
    await generateConstantsFile<Schema, VariableCategoryTable>({
        dbSchema: 'public',
        tableName: 'variable_categories',
        outputFilePath: VAR_CAT_OUTPUT_PATH,
        rowTypeName: 'VariableCategory',
        idsConstantName: 'VARIABLE_CATEGORY_IDS',
        dataConstantName: 'VARIABLE_CATEGORIES_DATA',
        keyGenerationColumn: 'name',
        idColumn: 'id',
        orderByColumn: 'display_order',
        columnsToExclude: ['created_at', 'updated_at'], // Keep existing nulls like image_url for consistency with manual file
        numericColumns: ['display_order'] 
    });

    // Generate Unit Category Constants
    console.log('\n--- Generating Unit Category Constants ---');
    await generateConstantsFile<Schema, UnitCategoryTable>({
        dbSchema: 'public',
        tableName: 'unit_categories',
        outputFilePath: UNIT_CAT_OUTPUT_PATH,
        rowTypeName: 'UnitCategory',
        idsConstantName: 'UNIT_CATEGORY_IDS',
        dataConstantName: 'UNIT_CATEGORIES_DATA',
        keyGenerationColumn: 'name',
        idColumn: 'id',
        orderByColumn: 'name',
        columnsToExclude: ['created_at', 'updated_at', 'deleted_at'] // Exclude deleted_at as well
        // No specific numeric columns needed here
    });

    console.log('\nConstant generation complete.');
}

main().catch(error => {
    console.error("Failed to generate constants:", error);
    process.exit(1);
}); 