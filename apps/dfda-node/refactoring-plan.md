# Refactoring Plan for Project Structure (Monorepo Adoption)

This document outlines the necessary changes to the current project structure to adopt a monorepo architecture and align the core application with the target defined in `README.md` (White-Labeled Trial & Health Management Platform Instance Template).

**Target Monorepo Structure (Example):**
```
/
├── apps/
│   ├── dfda-node/          (White-label instance template - refactored from current project)
│   ├── network-manager/    (Internal app for dFDA network admin - Phase 2+)
│   ├── main-website/     (Public marketing/sales website - e.g., dfda.earth)
│   └── dfda-connect/       (Central service handling third-party data imports)
├── packages/
│   ├── shared-types/       (Shared TypeScript types)
│   ├── ui/                 (Optional shared UI components)
│   └── utils/              (Shared utility functions)
├── package.json            (Root workspace config)
└── ... (Other config files: tsconfig, turborepo.json, etc.)
```
*Note: Marketing site included in monorepo for initial solo-dev convenience. `dfda-connect` is a separate deployable app.*

**Target Roles within `dfda-node` Instance:** Admin, Provider, Patient, Research Partner, Developer.

## Phase 1 Actions:

*   **Monorepo Setup:**
    *   `[ ]` Initialize pnpm workspaces (or similar monorepo structure).
    *   `[ ]` (Optional but recommended) Add Turborepo or Nx for build caching/optimization.
    *   `[ ]` Configure root `package.json`, `tsconfig.json`, etc.
*   **Move & Refactor Current App:**
    *   `[ ]` Create `apps/instance-template` directory.
    *   `[ ]` Move the entire current project content (app, components, lib, public, etc.) into `apps/instance-template`.
    *   `[ ]` Update `apps/instance-template/package.json` and paths accordingly.
    *   `[ ]` Create placeholders for `apps/network-manager` and `packages/*`.
*   **Refactor `apps/instance-template` Code (Based on previous checklist):**

| Current Directory (`apps/instance-template/...`) | Proposed Action      | Rationale & Notes                                                                                                                               |
| :----------------------------------------------- | :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(protected)/`                               | `[ ]` Keep & Refactor      | Concept remains. Routes within change based on Admin, Provider, Patient, Research Partner, Developer roles.                                                                  |
| `app/actions/`                                   | `[ ]` Keep & Refactor      | Server actions needed. Update implementations for new features/models/roles.                                                                    |
| `app/admin/`                                     | `[ ]` Keep & Refactor      | Core role. Heavy refactoring for new features (trial/user mgmt, billing, modules, settings).                                                    |
| `app/auth/`                                      | `[ ]` Keep & Refactor      | Core auth logic. May need instance context updates. Consolidate `login`, `register`, `forgot-password`.                                         |
| `components/` (within instance-template)         | `[ ]` Refactor/Move to `packages/ui` | Identify truly shared components vs. instance-specific ones. Move shared to `packages/ui`.                                                |
| `app/conditions/`                                | `[ ]` Keep & Refactor      | Fits `/public/conditions/[id]`.                                                                                                                 |
| `app/contact/`                                   | `[ ]` Keep & Refactor      | Fits `/public/contact`.                                                                                                                         |
| `app/developers/`                                | `[ ]` Keep & Refactor      | Developer portal content. Retain developer role functionality.                                            |
| `app/doctor/`                                    | `[ ]` **Remove / Merge**   | Merge functionality into `/provider`.                                                                                                           |
| `app/find-trials/`                               | `[ ]` Keep & Refactor      | Fits `/public/find-trials`.                                                                                                                     |
| `app/forgot-password/`                           | `[ ]` **Remove** (Merged)  | Merged into `app/auth/`.                                                                                                                        |
| `app/globals.css`                                | `[ ]` Keep                 | Base styling for instance template.                                                                                                             |
| `app/impact/`                                    | `[ ]` Keep & Refactor      | Fits `/public/impact`.                                                                                                                          |
| `app/layout.tsx`                                 | `[ ]` Keep & Refactor      | Root layout for instance template. Needs context/theme updates.                                                                                 |
| `lib/` (within instance-template)                | `[ ]` Refactor/Move to `packages/utils` | Identify shared utilities vs. instance-specific ones. Move shared to `packages/utils`.                                                    |
| `app/login/`                                     | `[ ]` **Remove** (Merged)  | Merged into `app/auth/`.                                                                                                                        |
| `app/outcome-labels/`                            | `[ ]` **Remove / Merge**   | Integrate functionality into admin analytics dashboard instead of having a standalone page.                                                                                   |
| `app/page.tsx`                                   | `[ ]` Keep & Refactor      | Root public homepage (`/`). Needs instance configuration.                                                                                       |
| `app/patient/`                                   | `[ ]` Keep & Refactor      | Core role. **Significant expansion/refactoring** for new features. Defer community, goals and learning sections for later phases.                                                                              |
| `app/privacy/`                                   | `[ ]` Keep & Refactor      | Fits `/public/privacy`. Needs templating.                                                                                                       |
| `app/provider/`                                  | `[ ]` Keep & Refactor      | Core role. Refactor for defined features. Incorporate relevant doctor functionality.                                                                                                      |
| `app/provider-resources/`                        | `[ ]` **Remove / Merge**   | Remove and make content manageable via `/admin/content`.                                                                                             |
| `app/register/`                                  | `[ ]` **Remove** (Merged)  | Merged into `app/auth/`.                                                                                                                        |
| `app/research-partner/`                          | `[ ]` Keep & Refactor      | Retain research partner functionality and enhance for trial management features.                                                                                            |
| `app/terms/`                                     | `[ ]` Keep & Refactor      | Fits `/public/terms`. Needs templating.                                                                                                         |
| `app/treatment/`                                 | `[ ]` Keep & Refactor      | Fits `/public/treatments/[id]`. Relevant for logging. E-commerce integration deferred to later phase.                                                                                |

| Current Directory        | Proposed Action      | Rationale & Notes                                                                                                                               |
| :----------------------- | :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `(protected)/`           | `[ ]` Keep & Refactor      | Concept of protected routes remains. Specific routes within will change based on the new sitemap roles (Admin, Provider, Patient, Research Partner, Developer).                |
| `actions/`               | `[ ]` Keep & Refactor      | Server actions are needed, but implementations must be updated to match the new features, data models, and roles.                               |
| `admin/`                 | `[ ]` Keep & Refactor      | Core role exists. Needs heavy refactoring to implement new features: trial mgmt, user mgmt (Provider/Patient), billing, module mgmt, settings etc. |
| `auth/`                  | `[ ]` Keep & Refactor      | Core authentication logic (Login, Register, Password Reset) is essential. May need updates for instance-specific context.                       |
| `components/`            | `[ ]` Move & Refactor      | Shared components are essential. Best practice is often a root `components/` dir. Components need review/refactoring for new features.          |
| `conditions/`            | `[ ]` Keep & Refactor      | Public info fits `/public/conditions/[id]`. Code might be reusable.                                                                             |
| `contact/`               | `[ ]` Keep & Refactor      | Public info fits `/public/contact`. Code might be reusable.                                                                                     |
| `developers/`            | `[ ]` Keep & Refactor      | Developer portal for instance API integration is part of the plan. Content needs alignment.                                                     |
| `doctor/`                | `[ ]` **Remove / Merge**   | Role seems redundant with `Provider`. Functionality should be merged into `/provider` routes.                                                   |
| `find-trials/`           | `[ ]` Keep & Refactor      | Public info fits `/public/find-trials`. May also integrate querying the central dFDA registry later.                                            |
| `forgot-password/`       | `[ ]` Merge into `auth/`   | Consolidate auth flows under `/auth`.                                                                                                           |
| `globals.css`            | `[ ]` Keep                 | Base styling.                                                                                                                                   |
| `impact/`                | `[ ]` Keep & Refactor      | Public info fits `/public/impact`. Code might be reusable.                                                                                      |
| `layout.tsx`             | `[ ]` Keep & Refactor      | Root layout is essential. Needs updates for potential context providers, theme changes based on instance branding.                              |
| `lib/`                   | `[ ]` Keep & Refactor      | Utility functions are needed. Review and refactor for new architecture and features.                                                            |
| `login/`                 | `[ ]` Merge into `auth/`   | Consolidate auth flows under `/auth`.                                                                                                           |
| `outcome-labels/`        | `[ ]` **Remove / Merge**   | Integrate functionality into admin analytics dashboard instead of having a standalone page.                                                                                   |
| `page.tsx`               | `[ ]` Keep & Refactor      | Represents the root public homepage (`/`). Content needs to be instance-configurable.                                                           |
| `patient/`               | `[ ]` Keep & Refactor      | Core role exists. Needs **significant expansion and refactoring** based on the detailed patient features (logging, insights, AI doc, store etc.). |
| `privacy/`               | `[ ]` Keep & Refactor      | Public info fits `/public/privacy`. Content needs to be instance-configurable/template.                                                         |
| `provider/`              | `[ ]` Keep & Refactor      | Core role exists. Needs refactoring based on the defined provider features (patient mgmt within trials, data view, AI consultation).             |
| `provider-resources/`    | `[ ]` **Remove / Merge**   | Remove and make content manageable via `/admin/content`.                                                                                             |
| `register/`              | `[ ]` Merge into `auth/`   | Consolidate auth flows under `/auth`. Needs to handle patient registration/enrollment.                                                          |
| `research-partner/`      | `[ ]` Keep & Refactor      | Retain research partner functionality and enhance for trial management features.                                                                                            |
| `terms/`                 | `[ ]` Keep & Refactor      | Public info fits `/public/terms`. Content needs to be instance-configurable/template.                                                           |
| `treatment/`             | `[ ]` Keep & Refactor      | Public info fits `/public/treatments/[id]`. Also relevant for `/patient/log/treatment` and the optional E-commerce module.                      |

**Summary of Major Changes:**

*   **Role Preservation:** Keep `research-partner` and `developer` roles while enhancing their functionality.
*   **Doctor Role Consolidation:** Merge `doctor` role into `provider`.
*   **Page Simplification:** Remove or simplify low-value pages (outcome-labels, provider-resources).
*   **Feature Deferral:** Defer implementation of patient community, goals, learning sections, and e-commerce module.
*   **Dashboard Consolidation:** Streamline dashboard views to reduce redundancy.
*   **Significant Refactoring:** `admin`, `patient`, `provider`, `research-partner` directories require major updates and expansion.
*   **New Structure:** Need to implement the route grouping (`/(public)/`, `/(auth)/`, `/(shared)/` etc.) defined in the sitemap.
*   **Modularity:** Implement logic for essential modules first, defer optional modules (E-commerce) to later phases.
*   **White-Labeling:** Implement mechanisms for instance-specific configuration (branding, content, UI settings) managed via `/admin`.

This plan provides a clear path for restructuring the existing `app/` directory to build the foundation for the white-labeled Trial & Health Management Platform instances.

---

## Database Schema Changes Checklist

The following database changes are required to support the target architecture and features. These will likely involve creating new migration files.

*   **Roles & Policies:**
    *   `[ ]` Keep existing user types and enhance roles as needed: Admin, Provider, Patient, Research Partner, Developer.
    *   `[ ]` **Update RLS Policies:** Review and enhance policies for all relevant tables based on all roles within the instance. Ensure appropriate access control for each role.
*   **API Access & OAuth:**
    *   `[ ]` **Maintain OAuth Tables:** Keep `oauth_clients`, `oauth_access_tokens`, `oauth_refresh_tokens`, `oauth_scopes` for Patient-Facing API integration. Will be needed for SMART on FHIR implementation.
    *   `[ ]` Create table `api_keys` for managing instance-level API keys (scoped appropriately, managed by appropriate roles for organizational integrations).
*   **Patient Data Expansion:**
    *   `[ ]` Ensure `/patient/data/export` functionality is planned and robust.
    *   `[ ]` Create table/columns for `patient_food_log`.
    *   `[ ]` Create table/columns for `patient_activity_log`.
    *   `[ ]` Create table/columns for `patient_condition_events`.
    *   `[ ]` Create table `patient_data_import_sources` (for connected apps/devices, storing auth tokens securely).
    *   `[ ]` Create table/columns for storing generated `patient_insights`.
    *   `[ ]` Create table/columns for `patient_health_goals`.
    *   `[ ]` Create table/columns for `learning_resources` and potentially patient progress.
    *   `[ ]` Review `treatment_ratings` and `reported_side_effects` for alignment with features.
*   **AI Doctor Module:**
    *   `[ ]` Create table `ai_doctor_sessions` (linking to patient, provider if shared, storing history/transcript references).
    *   `[ ]` Create table `ai_doctor_sharing_permissions`.
*   **E-commerce Module (Optional):**
    *   `[ ]` Create table `products` (with `manufacturer`, `batch_lot_info`, etc.).
    *   `[ ]` Create table `orders`.
    *   `[ ]` Create table `order_items` (linking `orders` and `products`, storing specific batch info).
    *   `[ ]` Create table `cart_items`.
    *   `[ ]` Add foreign key from `measurements` (treatment logs) to `order_items` to link usage to purchase.
*   **Instance Configuration:**
    *   `[ ]` Create table `instance_settings` or similar to store branding config, content IDs, UI settings, etc. (Alternatively, use a dedicated schema or rely on deployment configuration).
    *   `[ ]` Create table `instance_module_activations` to track which optional modules (E-commerce, AI Doctor, Network Insights) are active for the instance.
    *   `[ ]` Create table `instance_network_config` to store dFDA connection settings and data contribution rules.
*   **Traceability:**
    *   `[ ]` Ensure `treatments` table (if used directly) or `products` table has necessary fields for source/manufacturer/batch tracking.
*   **General Review:**
    *   `[ ]` Review existing tables (e.g., `trials`, `measurements`, `conditions`) for any necessary column additions/modifications to support new features.
    *   `[ ]` Review existing functions and views for compatibility with schema changes.
