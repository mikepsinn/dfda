# Test GitHub Actions locally
# This script helps test GitHub Actions workflows locally using act

# Function to check if a command exists
function Test-Command {
    param($Command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try {
        Get-Command $Command
        return $true
    }
    catch {
        return $false
    }
    finally {
        $ErrorActionPreference = $oldPreference
    }
}

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        $dockerStatus = docker info 2>&1
        return $true
    }
    catch {
        return $false
    }
}

# Check if act is installed
if (-not (Test-Command "act")) {
    Write-Host "Installing act using winget..."
    winget install nektos.act
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install act. Please install it manually from: https://github.com/nektos/act"
        exit 1
    }
    Write-Host "act installed successfully!"
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Check if Docker is installed and running
if (-not (Test-Command "docker")) {
    Write-Error "Docker is not installed. Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
}

if (-not (Test-DockerRunning)) {
    Write-Error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
}

# Default workflow file
$workflowFile = ".github/workflows/links.yml"

# Parse command line arguments
param(
    [string]$workflow = $workflowFile,
    [switch]$dryRun,
    [string]$event = "workflow_dispatch"
)

# Navigate to repository root (assuming script is in apps/web/scripts)
Set-Location (Join-Path $PSScriptRoot "../../..")

# Check if workflow file exists
if (-not (Test-Path $workflow)) {
    Write-Error "Workflow file not found: $workflow"
    exit 1
}

Write-Host "Testing GitHub Action: $workflow"
Write-Host "Event: $event"

if ($dryRun) {
    Write-Host "Performing dry run..."
    act -n $event -W $workflow
}
else {
    Write-Host "Running workflow..."
    act $event -W $workflow --container-architecture linux/amd64
}

# Return to original directory
Set-Location $PSScriptRoot 