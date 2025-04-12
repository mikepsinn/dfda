##################################################
# DFDA Node App Structure Reorganization Script
# This script reorganizes the existing app structure to be more intuitive
##################################################

# Set error action preference
$ErrorActionPreference = "Stop"

# Start logging
$logFile = "refactoring-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
function Write-Log {
    param (
        [string]$message,
        [string]$color = "White"
    )
    
    Write-Host $message -ForegroundColor $color
    Add-Content -Path $logFile -Value $message
}

Write-Log "Starting DFDA Node App Structure Reorganization..." "Green"
Write-Log "Log file: $logFile" "Green"

# Function to safely move directories
function Move-SafeDirectory {
    param (
        [string]$source,
        [string]$destination,
        [switch]$force = $true
    )
    
    if (Test-Path $source) {
        Write-Log "Moving $source to $destination" "Cyan"
        
        # Create parent directory if it doesn't exist
        $parentDir = Split-Path -Parent $destination
        if (-not (Test-Path $parentDir)) {
            New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
        }
        
        try {
            Move-Item -Path $source -Destination $destination -Force:$force
            Write-Log "  ✓ Successfully moved" "Green"
        } catch {
            Write-Log "  ✗ Error moving directory: $_" "Red"
        }
    } else {
        Write-Log "Source directory doesn't exist: $source" "Yellow"
    }
}

# Create backup of the entire app directory
$backupDir = "app-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Log "Creating backup of the entire app directory to $backupDir" "Magenta"
try {
    Copy-Item -Path "app" -Destination $backupDir -Recurse -Force
    Write-Log "  ✓ Backup created successfully" "Green"
} catch {
    Write-Log "  ✗ Failed to create backup: $_" "Red"
    Write-Log "Exiting script for safety" "Red"
    exit 1
}

###########################
# IDENTIFY LOW-VALUE PAGES TO REMOVE
###########################
Write-Log "Identifying low-value pages to remove..." "Yellow"

$pagesToRemove = @(
    "app/outcome-labels",
    "app/find-trials", # Consolidate with app/patient/find-trials
    "app/provider/form-management/create" # Should be part of main form management
)

foreach ($page in $pagesToRemove) {
    if (Test-Path $page) {
        Write-Log "Removing low-value page: $page" "Red"
        try {
            # Back up the page before removing
            $backupPath = "$backupDir/removed-pages/$(($page -replace '/', '_'))"
            $backupDir = Split-Path -Parent $backupPath
            if (-not (Test-Path $backupDir)) {
                New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
            }
            Copy-Item -Path $page -Destination $backupPath -Recurse -Force
            
            # Remove the page
            Remove-Item -Path $page -Recurse -Force
            Write-Log "  ✓ Page removed and backed up to $backupPath" "Green"
        } catch {
            Write-Log "  ✗ Failed to remove page: $_" "Red"
        }
    }
}

# Create route groups if they don't exist
$routeGroups = @(
    "app/(public)",
    "app/(auth)",
    "app/(shared)",
    "app/(protected)" # Keep existing protected group but reorganize contents
)

foreach ($dir in $routeGroups) {
    if (-not (Test-Path $dir)) {
        Write-Log "Creating route group: $dir" "Cyan"
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
}

# Function to check for import path issues after moving
function Check-ImportPaths {
    param (
        [string]$directory
    )
    
    Write-Log "Checking for potential import path issues in $directory..." "Yellow"
    
    $files = Get-ChildItem -Path $directory -Recurse -File -Filter "*.tsx"
    $issuesFound = $false
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "from ['""]\.\.\/\.\.\/") {
            Write-Log "WARNING: Potential import path issue in $($file.FullName)" "Red"
            $issuesFound = $true
        }
    }
    
    if (-not $issuesFound) {
        Write-Log "  ✓ No import path issues found" "Green"
    }
}

###########################
# MOVE PUBLIC ROUTES
###########################
Write-Log "Moving public routes to (public) group..." "Yellow"

$publicRoutes = @(
    "app/conditions",
    "app/contact",
    "app/impact",
    "app/privacy",
    "app/terms",
    "app/treatments", # Changed from treatment to treatments
    "app/developers"  # Added this missing public route from sitemap
)

foreach ($route in $publicRoutes) {
    # Check if source is 'treatment' but we're renaming to 'treatments'
    if ($route -eq "app/treatments" -and (Test-Path "app/treatment")) {
        Write-Log "Renaming 'treatment' to 'treatments' for consistency" "Cyan"
        Move-SafeDirectory -source "app/treatment" -destination "app/(public)/treatments"
    } else {
        $source = $route
        $destination = "app/(public)/" + (Split-Path -Leaf $route)
        Move-SafeDirectory -source $source -destination $destination
    }
}

# Move homepage
if (Test-Path "app/page.tsx") {
    Write-Log "Moving homepage to (public) group" "Cyan"
    try {
        Copy-Item -Path "app/page.tsx" -Destination "app/page.tsx.backup" -Force
        Move-Item -Path "app/page.tsx" -Destination "app/(public)/page.tsx" -Force
        Write-Log "  ✓ Homepage moved successfully" "Green"
    } catch {
        Write-Log "  ✗ Failed to move homepage: $_" "Red"
    }
}

###########################
# MOVE AUTH ROUTES
###########################
Write-Log "Moving auth routes to (auth) group..." "Yellow"

$authRoutes = @(
    "app/login",
    "app/register",
    "app/forgot-password"
)

# Also move app/auth directory contents if they exist
if (Test-Path "app/auth") {
    Write-Log "Moving app/auth directory contents to (auth) group..." "Cyan"
    try {
        Get-ChildItem -Path "app/auth" -Recurse | ForEach-Object {
            $relativePath = $_.FullName.Substring((Get-Item "app/auth").FullName.Length + 1)
            $destination = "app/(auth)/$relativePath"
            
            if (-not $_.PSIsContainer) {
                $destinationDir = Split-Path -Parent $destination
                if (-not (Test-Path $destinationDir)) {
                    New-Item -Path $destinationDir -ItemType Directory -Force | Out-Null
                }
                
                Copy-Item -Path $_.FullName -Destination $destination -Force
            }
        }
        Write-Log "  ✓ Auth contents copied successfully" "Green"
    } catch {
        Write-Log "  ✗ Error copying auth contents: $_" "Red"
    }
}

foreach ($route in $authRoutes) {
    $source = $route
    $destination = "app/(auth)/" + (Split-Path -Leaf $route)
    Move-SafeDirectory -source $source -destination $destination
}

###########################
# CREATE SHARED ROUTES
###########################
Write-Log "Setting up shared routes..." "Yellow"

# Create shared route structure
$sharedRoutes = @(
    "app/(shared)/profile",
    "app/(shared)/",
    "app/(shared)/settings"
)

foreach ($route in $sharedRoutes) {
    if (-not (Test-Path $route)) {
        Write-Log "Creating $route" "Cyan"
        New-Item -Path $route -ItemType Directory -Force | Out-Null
    }
}

# Move user profile if it exists
if (Test-Path "app/(protected)/user") {
    Move-SafeDirectory -source "app/(protected)/user" -destination "app/(shared)/user"
}

###########################
# CONSOLIDATE TRIAL DETAILS AND PAYMENT
###########################
Write-Log "Consolidating trial details and payment routes..." "Yellow"

# Ensure trial details exists to consolidate into
if (Test-Path "app/patient/trial-details") {
    Write-Log "Consolidating trial payment functionality into trial details..." "Cyan"
    
    # Check if trial payment exists
    if (Test-Path "app/patient/trial-payment") {
        try {
            # Create consolidated directory
            $consolidatedDir = "$backupDir/consolidated/trial-management"
            if (-not (Test-Path $consolidatedDir)) {
                New-Item -Path $consolidatedDir -ItemType Directory -Force | Out-Null
            }
            
            # Backup both directories before consolidation
            Copy-Item -Path "app/patient/trial-details" -Destination "$consolidatedDir/trial-details" -Recurse -Force
            Copy-Item -Path "app/patient/trial-payment" -Destination "$consolidatedDir/trial-payment" -Recurse -Force
            
            Write-Log "  ✓ Both directories backed up for consolidation reference" "Green"
        } catch {
            Write-Log "  ✗ Error backing up for consolidation: $_" "Red"
        }
    }
}

###########################
# SIMPLIFY ADMIN STRUCTURE
###########################
Write-Log "Simplifying admin structure..." "Yellow"

# Create core admin directories
$adminDirs = @(
    "app/admin/",
    "app/admin/users",
    "app/admin/roles",
    "app/admin/trials",
    "app/admin/billing",
    "app/admin/settings",
    "app/admin/content"   # Added content section for managing resources
)

foreach ($dir in $adminDirs) {
    if (-not (Test-Path $dir)) {
        Write-Log "Creating $dir" "Cyan"
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
}

# Delete redundant admin directories if they exist
$redundantAdminDirs = @(
    "app/admin/recruitment-tools",
    "app/admin/budget-tracking",
    "app/admin/ui-settings"
)

foreach ($dir in $redundantAdminDirs) {
    if (Test-Path $dir) {
        Write-Log "Removing redundant admin directory: $dir" "Red"
        try {
            Remove-Item -Path $dir -Recurse -Force
            Write-Log "  ✓ Removed successfully" "Green"
        } catch {
            Write-Log "  ✗ Failed to remove: $_" "Red"
        }
    }
}

###########################
# REORGANIZE ROLE-BASED ROUTES
###########################
Write-Log "Reorganizing role-based routes..." "Yellow"

# Move patient routes to protected group
if (Test-Path "app/patient") {
    Move-SafeDirectory -source "app/patient" -destination "app/(protected)/patient"
}

# Move provider routes to protected group
if (Test-Path "app/provider") {
    Move-SafeDirectory -source "app/provider" -destination "app/(protected)/provider"
}

# Move research partner routes to protected group, but keep them separate for now
if (Test-Path "app/research-partner") {
    Write-Log "Moving research partner routes to protected group..." "Cyan"
    Move-SafeDirectory -source "app/research-partner" -destination "app/(protected)/research-partner"
}

###########################
# REMOVE PROVIDER-RESOURCES
###########################
Write-Log "Migrating provider-resources..." "Yellow"

if (Test-Path "app/provider-resources") {
    Write-Log "Provider resources will be managed via admin/content..." "Cyan"
    
    # Create admin/content if it doesn't exist
    if (-not (Test-Path "app/admin/content")) {
        New-Item -Path "app/admin/content" -ItemType Directory -Force | Out-Null
    }
    
    try {
        # Copy provider-resources for reference
        Copy-Item -Path "app/provider-resources/*" -Destination "app/admin/content/provider-resources-reference" -Recurse -Force
        
        # Remove original directory
        Remove-Item -Path "app/provider-resources" -Recurse -Force
        Write-Log "  ✓ Provider resources migrated successfully" "Green"
    } catch {
        Write-Log "  ✗ Error migrating provider resources: $_" "Red"
    }
}

###########################
# CHECK FOR IMPORT ISSUES
###########################
Write-Log "Checking for potential import issues in moved files..." "Yellow"

Check-ImportPaths -directory "app/(public)"
Check-ImportPaths -directory "app/(auth)"
Check-ImportPaths -directory "app/(shared)"
Check-ImportPaths -directory "app/(protected)"

###########################
# CREATE README WITH CHANGES
###########################
$readmePath = "REFACTORING-CHANGES.md"
Write-Log "Creating readme with changes at $readmePath..." "Cyan"

$readmeContent = @'
# App Structure Refactoring Changes

This document outlines the changes made to the application structure during refactoring.

## Major Changes

1. Reorganized route groups:
   - app/(public) - Public-facing content
   - app/(auth) - Authentication related pages
   - app/(shared) - Shared components across user roles
   - app/(protected) - Role-protected routes

2. Renamed routes for consistency:
   - "treatment" → "treatments"

3. Removed low-value pages:
   - app/outcome-labels
   - app/find-trials (consolidated with app/patient/find-trials)
   - app/provider/form-management/create (should be part of main form management)
   - Redundant admin sections (recruitment-tools, budget-tracking, ui-settings)

4. Simplification:
   - Moved provider resources to admin/content
   - Consolidated trial details and payment functionality

## Route Mappings

### Before → After
- app/treatment → app/(public)/treatments
- app/auth/* → app/(auth)/*
- app/patient/* → app/(protected)/patient/*
- app/provider/* → app/(protected)/provider/*
- app/provider-resources → app/admin/content/provider-resources-reference
- app/research-partner/* → app/(protected)/research-partner/*

## Next Steps

1. Review and fix import paths in all moved files
2. Update layout files in each route group
3. Test the application to ensure all routes work correctly
4. Update any hard-coded routes in the application
'@

Set-Content -Path $readmePath -Value $readmeContent

Write-Log "`nStructure reorganization completed!" "Green"
Write-Log "A backup of the original app directory was created at $backupDir" "Cyan"
Write-Log "A log file was created at $logFile" "Cyan"
Write-Log "A summary of changes was created at $readmePath" "Cyan"

Write-Log "`nWARNING: You will need to update import paths in moved files!" "Red"
Write-Log "Recommended next steps:" "Yellow"
Write-Log "1. Check all moved files for import path issues" "Yellow"
Write-Log "2. Update layout files in each route group" "Yellow"
Write-Log "3. Test the application to ensure all routes work correctly" "Yellow"
Write-Log "4. Update navigation components to use new routes" "Yellow"
