# Feature: Enhanced Image Analysis and Item Creation

## Goal

Enhance the "Add Item via Image" feature to allow users to capture multiple images (e.g., front of package, nutrition facts, ingredients/dosage, UPC) for foods and treatments. The system should analyze these images, extract relevant structured data, and save it appropriately into the database, leveraging existing structures and adding new ones where necessary. This will allow for richer item details and calculation of consumed ingredients.

## Plan Overview

The implementation involves changes across the frontend UI, backend actions, AI processing, and database schema.

### 1. UI Changes (`components/shared/ImageAnalysisCapture.tsx`)

-   **Multi-Image Capture:** Modify the state to hold multiple files/previews, keyed by type (e.g., `primary`, `nutrition`, `ingredients`, `upc`).
-   **Conditional Prompts:**
    -   User uploads/captures the `primary` image first.
    -   Initial analysis determines `type` ('food', 'treatment', 'meal', 'other').
    -   Based on `type`, display additional buttons:
        -   'food' (package): "Add Nutrition Facts", "Add Ingredients", "Add UPC".
        *   'treatment': "Add Dosage/Ingredients", "Add UPC".
        *   'meal'/'other': Potentially "Add Ingredients".
    -   Clicking these buttons allows capturing/uploading the corresponding image type.
-   **Data Display & Editing:** Show extracted data (from all images) in the form fields for user review and editing.
-   **Submission:** Send *all* captured images (named appropriately, e.g., `image_primary`, `image_nutrition`) and the final edited form data to the save action.

### 2. Backend Analysis (`lib/actions/analyze-image.ts`)

-   **Input:** Accept multiple named image files in the `FormData`.
-   **Enhanced `AiOutputSchema`:**
    -   Use a more structured schema, possibly `z.discriminatedUnion` on `type`.
    -   **Base:** `type`, `name`.
    -   **Food Schema:** `brand`, `upc`, `servingSize`, `calories`, `macros`, `ingredients` (list of `{ name: string, quantity: number | null, unit: string | null }`).
    *   **Treatment Schema:** `brand`, `upc`, `dosage_form`, `dosage_instructions`, `active_ingredients` (list of `{ name: string, strength_quantity: number | null, strength_unit: string | null }`), `inactive_ingredients` (list of `{ name: string, quantity: number | null, unit: string | null }`).
    -   **Ingredient Extraction:** The schema should guide the AI to extract ingredient names, quantities, and units where available.
-   **AI Prompt:** Update the prompt to instruct the AI on how to process multiple images and extract the detailed information for the relevant schema sections.
-   **Return:** Return the complex, validated object based on the enhanced schema.

### 3. Database Schema Changes (`lib/database.types.ts`, `lib/database.schemas.ts`)

-   **`variable_categories`:**
    -   Ensure categories 'Food', 'Treatment' exist.
    -   Add a new category: 'Ingredient'.
-   **`global_variables`:**
    -   Continues to be the central store for all trackable items (food, treatment, ingredients).
    -   Ingredients identified by the AI will be added here if they don't exist, using the 'Ingredient' category.
-   **`products`:**
    -   Leverage this existing table for commercial products.
    -   Link to `global_variables` via `products.global_variable_id`.
    -   Store `upc`, `brand_name`, `manufacturer` here.
-   **`food_details` (New Table):**
    -   `global_variable_id` (PK, FK to `global_variables`)
    -   `serving_size_quantity` (numeric, nullable)
    -   `serving_size_unit_id` (FK to `units`, nullable)
    -   `calories_per_serving` (numeric, nullable)
    -   `fat_per_serving` (numeric, nullable)
    -   `protein_per_serving` (numeric, nullable)
    -   `carbs_per_serving` (numeric, nullable)
    -   *(Other nutrition fields)*
    -   `created_at`, `updated_at`
-   **`treatment_details` (New Table):**
    -   `global_variable_id` (PK, FK to `global_variables`)
    -   `dosage_form` (text, nullable)
    -   `dosage_instructions` (text, nullable)
    -   `active_ingredients` (JSONB, nullable - Format: `[{ ingredient_global_variable_id: uuid, strength_quantity: number | null, strength_unit_id: uuid | null }]`)
    -   `created_at`, `updated_at`
-   **`item_ingredients` (New Table):**
    -   `id` (PK, uuid)
    -   `item_global_variable_id` (FK to `global_variables` - The parent food/treatment)
    -   `ingredient_global_variable_id` (FK to `global_variables` - The ingredient)
    -   `quantity_per_serving` (numeric, nullable - Null if amount not specified)
    -   `unit_id` (FK to `units`, nullable - Null if quantity is null)
    *   `is_active_ingredient` (boolean, default: false - Optional, could duplicate info in `treatment_details.active_ingredients`)
    *   `order` (integer, nullable - To maintain list order)
    *   `created_at`, `updated_at`
-   **Regeneration:** After schema changes, run `pnpm supabase:types` and `pnpm db:zod`.

### 4. Backend Save Logic (`lib/actions/save-item-from-image.ts`)

-   **Input:** Accept complex data object from the enhanced analysis action and multiple image files.
-   **Processing:**
    1.  Find/Create the main `global_variable` for the item.
    2.  If product info (UPC/brand) exists, Find/Create `products` record and link.
    3.  If food data exists, Insert/Update `food_details`.
    4.  If treatment data exists, Insert/Update `treatment_details` (including finding/creating ingredient `global_variables` for active ingredients).
    5.  For *each* ingredient extracted (active and inactive):
        *   Find/Create the ingredient `global_variable`.
        *   Find the appropriate `unit_id` if quantity is provided.
        *   Insert a record into `item_ingredients` linking the item GVarID to the ingredient GVarID, storing quantity (or null) and unit (or null).
    6.  Handle image file uploads (linking to `uploaded_files`, potentially to `user_variable_images` or directly to the new detail tables if appropriate).
    7.  Create/Update the `user_variables` record linking the item to the user.

## TODO List

-   [x] **Database:** Define and apply migrations for new tables (`food_details`, `treatment_details`, `item_ingredients`).
-   [X] **Database:** Run `pnpm supabase:types` and `pnpm db:zod` to update generated files.
-   [ ] **AI Schema:** Define the enhanced `AiOutputSchema` in `lib/actions/analyze-image.ts` using `z.discriminatedUnion` or similar.
-   [ ] **Backend Analysis:** Update `analyzeImageAction` to accept multiple named images.
-   [ ] **Backend Analysis:** Update `analyzeImageAction` prompt for multi-image processing and detailed extraction.
-   [ ] **Backend Analysis:** Implement logic in `analyzeImageAction` to call the AI model and return the validated, structured data.
-   [ ] **Frontend:** Update `ImageAnalysisCapture.tsx` state to handle multiple named images (`primary`, `nutrition`, etc.).
-   [ ] **Frontend:** Implement conditional UI in `ImageAnalysisCapture.tsx` to show relevant "Add Image" buttons after initial analysis.
-   [ ] **Frontend:** Update form fields and state (`formData`) in `ImageAnalysisCapture.tsx` to match the enhanced data structure.
-   [ ] **Frontend:** Modify image upload/capture logic to store images with appropriate type keys.
-   [ ] **Frontend:** Ensure all captured images are sent with distinct names in FormData during save.
-   [x] **Backend Save:** Update `saveVariableMeasurementsFromImageAction` to accept the new complex data structure and multiple files.
-   [x] **Backend Save:** Implement logic to find/create `global_variables` for the item.
-   [x] **Backend Save:** Implement logic to find/create/link `products` record.
-   [x] **Backend Save:** Implement logic to insert/update `food_details` or `treatment_details`.
-   [x] **Backend Save:** Implement logic to populate the `item_ingredients` table for all extracted ingredients.
-   [x] **Backend Save:** Update image storage logic as needed (Current logic handles single image upload/linking via `uploaded_files` and `user_variable_images`).
-   [x] **Backend Save:** Ensure `user_variables` creation/update still works.
-   [ ] **Testing:** Thoroughly test the end-to-end flow with various food and treatment packages.
-   [ ] **Calculation:** Implement logic (likely in a separate function or component) to calculate consumed ingredients based on logged item consumption, `food_details.serving_size_*`, and `item_ingredients.quantity_per_serving`.
