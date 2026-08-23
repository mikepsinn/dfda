# PowerShell script to kill all Node.js server processes
# This script will terminate all running node.exe processes

Write-Host "Killing all Node.js server processes..."
$hadFailures = $false

# Get all node processes and stop them
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    $process = $_
    try {
        Stop-Process -Id $process.Id -Force -ErrorAction Stop
        Write-Host "Killed Node.js process with ID $($process.Id)"
    } catch {
        $hadFailures = $true
        Write-Error "Failed to kill process with ID $($process.Id): $_"
    }
}

if ($hadFailures) {
    Write-Error "One or more Node.js processes could not be terminated."
    exit 1
}

Write-Host "All discovered Node.js server processes have been terminated."
