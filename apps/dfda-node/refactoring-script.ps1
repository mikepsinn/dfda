##################################################
# DFDA Node App Structure Reorganization Script
# This script reorganizes the existing app structure to be more intuitive
##################################################

Write-Host "Starting DFDA Node App Structure Reorganization..." -ForegroundColor Green

# Create backup of the entire app directory
$backupDir = "app-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "Creating backup of the entire app directory to $backupDir" -ForegroundColor Magenta
Copy-Item -Path "app" -Destination $backupDir -Recurse -Force

# Create route groups if they don't exist
$routeGroups = @(
    "app/(public)",
    "app/(auth)",
    "app/(shared)",
    "app/(protected)" # Keep existing protected group but reorganize contents
)

foreach ($dir in $routeGroups) {
    if (-not (Test-Path $dir)) {
        Write-Host "Creating route group: $dir" -ForegroundColor Cyan
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
}

# Function to check for import path issues after moving
function Check-ImportPaths {
    param (
        [string]$directory
    )
    
    Write-Host "Checking for potential import path issues in $directory..." -ForegroundColor Yellow
    
    $files = Get-ChildItem -Path $directory -Recurse -File -Filter "*.tsx"
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "from ['""]\.\.\/\.\.\/") {
            Write-Host "WARNING: Potential import path issue in $($file.FullName)" -ForegroundColor Red
        }
    }
}

###########################
# MOVE PUBLIC ROUTES
###########################
Write-Host "Moving public routes to (public) group..." -ForegroundColor Yellow

$publicRoutes = @(
    "app/conditions",
    "app/contact",
    "app/find-trials",
    "app/impact",
    "app/privacy",
    "app/terms",
    "app/treatment"
)

foreach ($route in $publicRoutes) {
    $source = $route
    $destination = "app/(public)/" + (Split-Path -Leaf $route)
    
    if (Test-Path $source) {
        Write-Host "Moving $source to $destination" -ForegroundColor Cyan
        
        # Create parent directory if it doesn't exist
        $parentDir = Split-Path -Parent $destination
        if (-not (Test-Path $parentDir)) {
            New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
        }
        
        Move-Item -Path $source -Destination $destination -Force
    } else {
        Write-Host "Source directory doesn't exist: $source" -ForegroundColor Red
    }
}

# Move homepage
if (Test-Path "app/page.tsx") {
    Write-Host "Moving homepage to (public) group" -ForegroundColor Cyan
    Copy-Item -Path "app/page.tsx" -Destination "app/page.tsx.backup" -Force
    Move-Item -Path "app/page.tsx" -Destination "app/(public)/page.tsx" -Force
}

###########################
# MOVE AUTH ROUTES
###########################
Write-Host "Moving auth routes to (auth) group..." -ForegroundColor Yellow

$authRoutes = @(
    "app/login",
    "app/register",
    "app/forgot-password"
)

# Also move app/auth directory contents if they exist
if (Test-Path "app/auth") {
    Write-Host "Moving app/auth directory contents to (auth) group..." -ForegroundColor Cyan
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
}

foreach ($route in $authRoutes) {
    $source = $route
    $destination = "app/(auth)/" + (Split-Path -Leaf $route)
    
    if (Test-Path $source) {
        Write-Host "Moving $source to $destination" -ForegroundColor Cyan
        Move-Item -Path $source -Destination $destination -Force
    } else {
        Write-Host "Source directory doesn't exist: $source" -ForegroundColor Red
    }
}

###########################
# CREATE SHARED ROUTES
###########################
Write-Host "Setting up shared routes..." -ForegroundColor Yellow

# Create shared route structure
$sharedRoutes = @(
    "app/(shared)/profile",
    "app/(shared)/dashboard",
    "app/(shared)/settings"
)

foreach ($route in $sharedRoutes) {
    if (-not (Test-Path $route)) {
        Write-Host "Creating $route" -ForegroundColor Cyan
        New-Item -Path $route -ItemType Directory -Force | Out-Null
    }
}

# Move user profile if it exists
if (Test-Path "app/(protected)/user") {
    Write-Host "Moving user profile to shared routes..." -ForegroundColor Cyan
    Move-Item -Path "app/(protected)/user" -Destination "app/(shared)/user" -Force
}

###########################
# SIMPLIFY ADMIN STRUCTURE
###########################
Write-Host "Simplifying admin structure..." -ForegroundColor Yellow

# Create core admin directories
$adminDirs = @(
    "app/admin/dashboard",
    "app/admin/users",
    "app/admin/roles",
    "app/admin/trials",
    "app/admin/billing",
    "app/admin/settings"
)

foreach ($dir in $adminDirs) {
    if (-not (Test-Path $dir)) {
        Write-Host "Creating $dir" -ForegroundColor Cyan
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
        Write-Host "Removing redundant admin directory: $dir" -ForegroundColor Red
        Remove-Item -Path $dir -Recurse -Force
    }
}


###########################
# REMOVE PROVIDER-RESOURCES
###########################
Write-Host "Removing provider-resources..." -ForegroundColor Yellow

if (Test-Path "app/provider-resources") {
    Write-Host "Provider resources will be managed via admin/content..." -ForegroundColor Cyan
    
    # Create admin/content if it doesn't exist
    if (-not (Test-Path "app/admin/content")) {
        New-Item -Path "app/admin/content" -ItemType Directory -Force | Out-Null
    }
    
    # Copy provider-resources for reference
    Copy-Item -Path "app/provider-resources/*" -Destination "app/admin/content/provider-resources-reference" -Recurse -Force
    
    # Remove original directory
    Remove-Item -Path "app/provider-resources" -Recurse -Force
}

###########################
# CHECK FOR IMPORT ISSUES
###########################
Write-Host "Checking for potential import issues in moved files..." -ForegroundColor Yellow

Check-ImportPaths -directory "app/(public)"
Check-ImportPaths -directory "app/(auth)"
Check-ImportPaths -directory "app/(shared)"

Write-Host "`nStructure reorganization completed!" -ForegroundColor Green
Write-Host "A backup of the original app directory was created at $backupDir" -ForegroundColor Cyan
Write-Host "`nWARNING: You will need to update import paths in moved files!" -ForegroundColor Red
Write-Host "Recommended next steps:" -ForegroundColor Yellow
Write-Host "1. Check all moved files for import path issues" -ForegroundColor Yellow
Write-Host "2. Update layout files in each route group" -ForegroundColor Yellow
Write-Host "3. Test the application to ensure all routes work correctly" -ForegroundColor Yellow
