##################################################
# DFDA Node App Refactoring Script
# This script implements the restructuring outlined in refactoring-plan.md
##################################################

Write-Host "Starting DFDA Node App Refactoring..." -ForegroundColor Green

# Create directory structure if it doesn't exist
$directories = @(
    "app/(public)",
    "app/(auth)",
    "app/(shared)"
)

foreach ($dir in $directories) {
    $path = "apps/dfda-node/$dir"
    if (-not (Test-Path $path)) {
        Write-Host "Creating directory: $path" -ForegroundColor Cyan
        New-Item -Path $path -ItemType Directory -Force | Out-Null
    }
}

###########################
# MOVE PUBLIC ROUTES
###########################
Write-Host "Moving public routes..." -ForegroundColor Yellow

# Routes to move to (public)
$publicRoutes = @(
    @{Source="app/terms"; Destination="app/(public)/terms"},
    @{Source="app/privacy"; Destination="app/(public)/privacy"},
    @{Source="app/contact"; Destination="app/(public)/contact"},
    @{Source="app/impact"; Destination="app/(public)/impact"},
    @{Source="app/find-trials"; Destination="app/(public)/find-trials"},
    @{Source="app/conditions"; Destination="app/(public)/conditions"},
    @{Source="app/treatment"; Destination="app/(public)/treatment"}
    # outcome-labels removed as it's being integrated into admin analytics
)

foreach ($route in $publicRoutes) {
    $source = "apps/dfda-node/$($route.Source)"
    $destination = "apps/dfda-node/$($route.Destination)"
    
    if (Test-Path $source) {
        Write-Host "Moving $source to $destination" -ForegroundColor Cyan
        # Copy-Item -Path $source -Destination $destination -Recurse -Force
        # This is commented out for dry-run. Uncomment to execute.
    } else {
        Write-Host "Source directory doesn't exist: $source" -ForegroundColor Red
    }
}

# Copy homepage
if (Test-Path "apps/dfda-node/app/page.tsx") {
    Write-Host "Copying homepage to (public)" -ForegroundColor Cyan
    # Copy-Item -Path "apps/dfda-node/app/page.tsx" -Destination "apps/dfda-node/app/(public)/page.tsx" -Force
    # This is commented out for dry-run. Uncomment to execute.
}

###########################
# MOVE AUTH ROUTES
###########################
Write-Host "Moving auth routes..." -ForegroundColor Yellow

# Routes to move to (auth)
$authRoutes = @(
    @{Source="app/login"; Destination="app/(auth)/login"},
    @{Source="app/register"; Destination="app/(auth)/register"},
    @{Source="app/forgot-password"; Destination="app/(auth)/forgot-password"}
)

foreach ($route in $authRoutes) {
    $source = "apps/dfda-node/$($route.Source)"
    $destination = "apps/dfda-node/$($route.Destination)"
    
    if (Test-Path $source) {
        Write-Host "Moving $source to $destination" -ForegroundColor Cyan
        # Copy-Item -Path $source -Destination $destination -Recurse -Force
        # This is commented out for dry-run. Uncomment to execute.
    } else {
        Write-Host "Source directory doesn't exist: $source" -ForegroundColor Red
    }
}

###########################
# MOVE SHARED ROUTES
###########################
Write-Host "Moving shared routes..." -ForegroundColor Yellow

# User profile and other shared functionality
$sharedRoutes = @(
    @{Source="app/(protected)/user"; Destination="app/(shared)/user"}
)

foreach ($route in $sharedRoutes) {
    $source = "apps/dfda-node/$($route.Source)"
    $destination = "apps/dfda-node/$($route.Destination)"
    
    if (Test-Path $source) {
        Write-Host "Moving $source to $destination" -ForegroundColor Cyan
        # Copy-Item -Path $source -Destination $destination -Recurse -Force
        # This is commented out for dry-run. Uncomment to execute.
    } else {
        Write-Host "Source directory doesn't exist: $source" -ForegroundColor Red
    }
}

###########################
# CREATE SHARED ROUTES (TEMPLATES)
###########################
Write-Host "Creating shared route templates..." -ForegroundColor Yellow

$sharedTemplates = @(
    @{Path="app/(shared)/profile"; Type="Directory"},
    @{Path="app/(shared)/dashboard"; Type="Directory"},
    @{Path="app/(shared)/notifications"; Type="Directory"},
    @{Path="app/(shared)/settings"; Type="Directory"},
    @{Path="app/(shared)/settings/account"; Type="Directory"},
    @{Path="app/(shared)/settings/consent"; Type="Directory"}
)

foreach ($template in $sharedTemplates) {
    $path = "apps/dfda-node/$($template.Path)"
    
    if (-not (Test-Path $path)) {
        Write-Host "Creating $path" -ForegroundColor Cyan
        # New-Item -Path $path -ItemType $template.Type -Force | Out-Null
        # This is commented out for dry-run. Uncomment to execute.
    }
}

###########################
# ENHANCE RESEARCH-PARTNER ROUTES
###########################
Write-Host "Enhancing research-partner routes..." -ForegroundColor Yellow

# Identify the research partner routes to enhance
$rpRoutes = @(
    "app/research-partner/create-trial",
    "app/research-partner/dashboard",
    "app/research-partner/trials"
)

foreach ($route in $rpRoutes) {
    $path = "apps/dfda-node/$route"
    
    if (Test-Path $path) {
        Write-Host "Research Partner route identified for enhancement: $path" -ForegroundColor Cyan
        # We're not moving or modifying these routes in this script
        # This is just a placeholder for future feature enhancements
    } else {
        Write-Host "Route path doesn't exist: $path" -ForegroundColor Red
    }
}

###########################
# MERGE DOCTOR FUNCTIONALITY INTO PROVIDER
###########################
Write-Host "Merging doctor functionality into provider..." -ForegroundColor Yellow

# Identify doctor routes to be merged
if (Test-Path "apps/dfda-node/app/doctor") {
    Write-Host "Doctor directory found. Functionality will be merged into provider role." -ForegroundColor Cyan
    # This requires manual integration, not just copying
}

###########################
# REMOVE LOW-VALUE PAGES
###########################
Write-Host "Identifying low-value pages to remove..." -ForegroundColor Yellow

$lowValuePages = @(
    "app/outcome-labels",
    "app/provider-resources"
)

foreach ($page in $lowValuePages) {
    $path = "apps/dfda-node/$page"
    
    if (Test-Path $path) {
        Write-Host "Low-value page identified for removal: $path" -ForegroundColor Cyan
        # This will be handled manually to ensure any valuable functionality is preserved
    } else {
        Write-Host "Page path doesn't exist: $path" -ForegroundColor Red
    }
}

###########################
# CREATE/UPDATE ADMIN ROUTE STRUCTURE (TEMPLATES)
###########################
Write-Host "Creating admin route templates..." -ForegroundColor Yellow

$adminTemplates = @(
    @{Path="app/admin/trials"; Type="Directory"},
    @{Path="app/admin/users"; Type="Directory"},
    @{Path="app/admin/roles"; Type="Directory"},
    @{Path="app/admin/billing"; Type="Directory"},
    @{Path="app/admin/analytics"; Type="Directory"},
    @{Path="app/admin/analytics/outcome-labels"; Type="Directory"}, # New location for outcome labels
    @{Path="app/admin/recruitment-tools"; Type="Directory"},
    @{Path="app/admin/budget-tracking"; Type="Directory"},
    @{Path="app/admin/content"; Type="Directory"},
    @{Path="app/admin/branding"; Type="Directory"},
    @{Path="app/admin/ui-settings"; Type="Directory"},
    @{Path="app/admin/module-management"; Type="Directory"},
    @{Path="app/admin/settings"; Type="Directory"},
    @{Path="app/admin/settings/general"; Type="Directory"},
    @{Path="app/admin/settings/network"; Type="Directory"},
    @{Path="app/admin/settings/integrations"; Type="Directory"},
    @{Path="app/admin/settings/compliance"; Type="Directory"},
    @{Path="app/admin/settings/usage-monitoring"; Type="Directory"}
)

foreach ($template in $adminTemplates) {
    $path = "apps/dfda-node/$($template.Path)"
    
    if (-not (Test-Path $path)) {
        Write-Host "Creating $path" -ForegroundColor Cyan
        # New-Item -Path $path -ItemType $template.Type -Force | Out-Null
        # This is commented out for dry-run. Uncomment to execute.
    }
}

###########################
# MOVE/REFACTOR PATIENT COMPONENTS
###########################
Write-Host "Identifying patient components to move to root components directory..." -ForegroundColor Yellow

# This finds component files within patient directories
$patientComponents = Get-ChildItem -Path "apps/dfda-node/app/patient" -Recurse -Filter "components" -Directory

foreach ($componentDir in $patientComponents) {
    Write-Host "Patient components found: $($componentDir.FullName)" -ForegroundColor Cyan
    # Here we would need to move specific components to the root components directory
    # This requires careful review of each component
}

###########################
# MOVE/REFACTOR PROVIDER COMPONENTS
###########################
Write-Host "Identifying provider components to move to root components directory..." -ForegroundColor Yellow

# This finds component files within provider directories
$providerComponents = Get-ChildItem -Path "apps/dfda-node/app/provider" -Recurse -Filter "components" -Directory

foreach ($componentDir in $providerComponents) {
    Write-Host "Provider components found: $($componentDir.FullName)" -ForegroundColor Cyan
    # Here we would need to move specific components to the root components directory
    # This requires careful review of each component
}

Write-Host "Refactoring script completion. This was a DRY RUN - no files were modified." -ForegroundColor Green
Write-Host "To execute the changes, remove the comment markers from the Copy-Item and New-Item commands." -ForegroundColor Yellow 