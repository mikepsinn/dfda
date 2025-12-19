# PowerShell script to kill all Node.js server processes
# This script will terminate all running node.exe processes

Write-Host "Killing all Node.js server processes..."

# Get all node processes and stop them
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction Stop
        Write-Host "Killed Node.js process with ID $($_.Id)"
    } catch {
        Write-Host "Failed to kill process with ID $($_.Id): $_"
    }
}

Write-Host "All Node.js server processes have been terminated."
