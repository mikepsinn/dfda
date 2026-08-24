# This script helps when IntelliJ IDEA has locked project files due to node processes
# Particularly useful when you get the "Cannot delete/move file" error in IntelliJ
# 
# INSTRUCTIONS:
#   1. Open PowerShell
#   2. Navigate to script location
#   3. Run: .\kill_node.ps1
#   4. To stop the script, press Ctrl+C
#
# WARNING: This will continuously kill all node processes every second!
# Only run this temporarily when you need to move/delete locked files

Write-Host "Starting node process killer..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the script" -ForegroundColor Cyan
Write-Host "Monitoring for node processes..." -ForegroundColor Green

while ($true) {
    $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "`nFound node processes:" -ForegroundColor Yellow
        $processes | Write-Output
        $processes | Stop-Process -Force
        Write-Host "Node processes killed!" -ForegroundColor Red
    }
    Write-Host "." -NoNewline -ForegroundColor Gray
    Start-Sleep -Seconds 1
}