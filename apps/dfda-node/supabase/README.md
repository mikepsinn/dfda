# Migration Naming Policy

This project uses a strict naming convention for all migration files to ensure clarity, maintainability, and correct dependency ordering. All migration files are located in this directory.

## Naming Convention

Each migration filename follows this pattern:

```
YYYYMMDDHHMMSS_<type>_<description>.sql
```

- `YYYYMMDDHHMMSS`: Timestamp prefix (year, month, day, hour, minute, second) to ensure correct order of execution and allow for future insertions.
- `<type>`: Migration type prefix (see below).
- `<description>`: Short, descriptive name of the migration's purpose.

## Type Prefixes

| Prefix         | Description                                 | Example                                      |
|---------------|---------------------------------------------|----------------------------------------------|
| `extension_`  | PostgreSQL extensions                       | `20240101010000_extension_moddatetime.sql`   |
| `enum_`       | Enum type definitions                       | `20240101020000_enum_form_question_type.sql` |
| `table_`      | Table creation or alteration                 | `20240101030000_table_unit_categories.sql`   |
| `function_`   | Function definitions                        | `20240101025000_function_update_updated_at_column.sql` |
| `trigger_`    | Trigger definitions                         | `20240101050100_trigger_updated_at.sql`      |
| `view_`       | View definitions                            | `20240101060000_view_patient_conditions.sql` |
| `policy_`     | Row-level security (RLS) policies           | `20240101070000_policy_profiles.sql`         |
| `rls_`        | RLS helper migrations (e.g., storage)        | `20240101071100_rls_storage_insert.sql`      |
| `constraint_` | Constraints (unique, check, etc.)           | `20240101080000_constraint_unit_category_base_unit.sql` |
| `index_`      | Index definitions                           | `20240101090000_index_trial_actions.sql`     |
| `alter_`      | Table or column alterations                  | `20240101033400_table_alter_add_profile_timezone.sql` |

## Guidelines

- **Order matters:** The timestamp prefix ensures migrations are applied in the correct order. Always use a timestamp that places the migration after its dependencies but leaves room for future insertions.
- **Type grouping:** Migrations are grouped by type using the timestamp. For example, all `table_` migrations are in the `03` hour block, all `function_` migrations in the `04` or `02` block, etc.
- **Descriptive names:** The `<description>` should clearly state the purpose of the migration.
- **Atomic migrations:** Each migration should perform a single logical change (e.g., create one table, add one function, etc.).
- **Dependencies:** If a migration depends on another (e.g., a trigger depends on a function), ensure the timestamp of the dependency is earlier.
- **One object per migration:** Add only one table, view, policy, etc. per migration file.
- **Type and time grouping:** When adding multiple migrations of the same type (e.g., several `policy_` or `table_` migrations), **always use the same, consistent timestamp prefix for all of them, regardless of the current date**. To ensure uniqueness, increment the last digits (usually the seconds) of the timestamp for each new migration of the same type. For example, if your existing policies use `20240101070000_policy_...sql`, the next should be `20240101070001_policy_...sql`, then `20240101070002_policy_...sql`, etc.
- **Avoid duplicate timestamps:** Never use the same timestamp for more than one migration of the same type. Always increment the last digits (seconds) for each new migration.
- **Check before adding:** Always review the existing migration files in `/supabase/migrations` to determine the correct next timestamp.
- **If you make a mistake:** Rename migrations as needed to maintain the correct order and grouping.
- **Modify, don't add, during prototyping:** During the prototyping phase, modify the existing initial migration files in `/supabase/migrations` for database changes. Do not create new migrations unless absolutely necessary.
- **Naming:** Name migrations like `{timestamp right after the last similar migration time so they're grouped}_{table|view|whatever}_{name of table, view, etc}.sql`.
- **After changes:** Run `pnpm run db:setup` after making schema changes in the migration file to apply them locally.

## Checklist for Adding a New Migration

1. Check the `/supabase/migrations` directory for the highest timestamp for your migration type.
2. Use the same prefix as existing migrations of that type.
3. Increment the last digits (seconds) to ensure uniqueness.
4. Double-check that no two files of the same type share a timestamp.
5. If you find a mistake, rename the files to restore correct order and grouping.

## Example

```
20240101030000_table_unit_categories.sql
20240101025000_function_update_updated_at_column.sql
20240101050100_trigger_updated_at.sql
20240101060000_view_patient_conditions.sql
20240101070000_policy_profiles.sql
20240101070001_policy_patients.sql
20240101070002_policy_data_submissions.sql
20240101070003_policy_measurements.sql
20240101070004_policy_notifications.sql
20240101070005_policy_oauth_access_tokens.sql
20240101070006_policy_oauth_refresh_tokens.sql
20240101070007_policy_user_variables.sql
```

This ensures that:
- The `unit_categories` table is created before anything that depends on it.
- The `update_updated_at_column` function exists before any triggers that use it.
- The `updated_at` trigger is created after the function and table.
- Views and policies are created after the tables they depend on.
- **All policies, even those added later, share the same timestamp prefix, keeping them grouped together.**
- Each migration file remains unique and is applied in the intended order.

---

**Always follow this convention when adding new migrations.** 