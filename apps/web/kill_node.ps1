# Get all Node.js processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

# Check if there are any Node.js processes running
if ($nodeProcesses) {
    # Kill each Node.js process
    foreach ($process in $nodeProcesses) {
        Stop-Process -Id $process.Id -Force
        Write-Output "Killed Node.js process with ID: $($process.Id)"
    }
} else {
    Write-Output "No Node.js processes found."
}