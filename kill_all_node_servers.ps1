# PowerShell script to kill all Node.js server processes
# This script will terminate all running node.exe processes

Write-Host "Killing all Node.js server processes..."
$hadFailures = $false

# Discover processes while distinguishing "none found" from real discovery failures.
$discoveryErrors = @()
$processes = @(Get-Process node -ErrorAction SilentlyContinue -ErrorVariable discoveryErrors)
foreach ($discoveryError in $discoveryErrors) {
    if ($discoveryError.FullyQualifiedErrorId -notlike "NoProcessFoundForGivenName*") {
        $hadFailures = $true
        Write-Error "Failed to discover Node.js processes: $discoveryError"
    }
}

foreach ($process in $processes) {
    try {
        # Opening the handle before termination avoids looking up a recycled PID.
        $null = $process.Handle
        $process.Kill()
        $process.WaitForExit()
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
