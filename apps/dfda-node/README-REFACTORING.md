# DFDA Node Refactoring Guide

This document provides guidance on using the refactoring tools and plans created for the DFDA Node application restructuring.

## Overview of Refactoring Documents

1. **existing-sitemap.md** - Documents the current project structure
2. **refactoring-plan.md** - The original refactoring requirements and plans
3. **refactoring-script.ps1** - PowerShell script to handle file moves and directory creation
4. **database-migration-plan.md** - Detailed plan for database schema changes
5. **implementation-plan.md** - Step-by-step prioritized implementation plan

## Using the PowerShell Refactoring Script

The `refactoring-script.ps1` file contains a PowerShell script that will help restructure the project files according to the refactoring plan. By default, this script runs in "dry run" mode, which means it will only show what changes would be made without actually making them.

### Running in Dry Run Mode

```powershell
# Change to the project directory
cd E:\code\decentralized-fda

# Run the script in dry run mode
.\apps\dfda-node\refactoring-script.ps1
```

This will display all the operations the script would perform, allowing you to review them before making any changes.

### Performing the Actual Refactoring

To perform the actual refactoring, you need to edit the script and uncomment the Copy-Item and New-Item commands by removing the comment markers. Then run the script:

```powershell
# Edit the script first to uncomment the Copy-Item and New-Item commands
# Then run:
.\apps\dfda-node\refactoring-script.ps1
```

### Important Notes on File Moves

- The script uses `Copy-Item` instead of `Move-Item` to preserve the original files during testing
- After verifying that the copied files work correctly, you'll need to manually delete the original files
- Make sure to carefully check import paths in moved files to ensure they still work

## Database Migration Process

The database migration plan provides SQL statements for all required schema changes. Follow these steps to implement the database changes:

1. Create a test branch in your database:
   ```bash
   pnpm db:branch refactor-test
   ```

2. Create a new migration file:
   ```bash
   # Create migration file
   pnpm supabase migration new refactor_phase_1
   ```

3. Copy the relevant SQL statements from `database-migration-plan.md` into the migration file

4. Apply the migration to the test branch:
   ```bash
   pnpm supabase db push --db-url=$TEST_DB_URL
   ```

5. Test thoroughly before applying to production

## Implementation Approach

The `implementation-plan.md` file provides a prioritized approach to the refactoring work. It's recommended to follow the phases in order:

1. Route Structure Refactoring (high priority)
2. Feature Refactoring and Enhancement (medium priority)
   - This includes enhancing Research Partner and Developer roles
3. Database Schema Refactoring (high/medium priority)
4. Feature Implementation for Core Modules (high priority)
5. Optional Module Implementation (low priority)

Each phase should be completed with thorough testing before moving to the next.

## Manual Steps Required

Some aspects of the refactoring cannot be automated and require manual intervention:

1. Updating import paths in moved files
2. Enhancing research-partner and developer functionality
3. Moving components from app subdirectories to the root components directory
4. Updating API calls to reflect new endpoints/routes
5. Testing each refactored section

## Version Control Recommendations

1. Create a dedicated branch for the refactoring work
2. Commit changes after each logical step (not necessarily after each file move)
3. Write detailed commit messages explaining what was changed and why
4. Consider using feature flags for major changes to allow for easier rollback

## Getting Started

Begin by reviewing all the refactoring documents to understand the plan, then:

1. Run the refactoring script in dry run mode to preview changes
2. Start with Phase 1 tasks from the implementation plan
3. Test continuously as you refactor
4. Document any issues or decisions made during the process 