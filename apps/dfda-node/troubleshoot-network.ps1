<#
.SYNOPSIS
    Diagnoses and attempts to fix common network connectivity issues related to SSL/Auth errors,
    specifically targeting Time Service, Hosts file, Winsock, Firewall, MTU, and basic connectivity.

.DESCRIPTION
    This script performs the following actions:
    1. Ensures it is running with Administrator privileges.
    2. Checks basic TCP connectivity to the target host/port.
    3. Performs an iterative MTU path discovery test.
    4. Checks the hosts file for potential Supabase redirects and outputs its content.
    5. Checks the Windows Time service (W32Time), enables/starts it if necessary.
    6. Forces a time resynchronization with the configured time source.
    7. Lists potentially relevant outbound firewall rules.
    8. Lists active network adapter details and driver info.
    9. Lists Winsock Layered Service Providers (LSPs).
    10. Checks TLS/SSL Protocol Settings (Client-Side).
    11. Attempts an OpenSSL connection test and captures output/errors.
    12. Temporarily disables the Windows Defender Firewall (Active Profile).
    13. Temporarily disables Windows Defender Real-time Protection.
    14. Runs System File Checker (SFC) to scan/repair system files.
    15. Resets the Winsock catalog.
    16. Prompts the user to restart the computer.
#>

param([string]$TargetHost = "aws-0-us-east-1.pooler.supabase.com", [int]$TargetPort = 6543)

# Self-elevation check
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]'Administrator')) {
    Write-Warning "This script needs Administrator privileges to run correctly."
    try {
        $newProcess = New-Object System.Diagnostics.ProcessStartInfo "PowerShell";
        # Pass parameters to the elevated instance - ensure correct quoting
        # Use " -File \".\troubleshoot-network.ps1\" " format for script path
        # Use simple -Parameter Value format for others
        $scriptArgs = "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`" -TargetHost $TargetHost -TargetPort $TargetPort"
        $newProcess.Arguments = $scriptArgs;
        $newProcess.Verb = "runas";
        [System.Diagnostics.Process]::Start($newProcess) | Out-Null
        Write-Host "Attempting to relaunch script with Administrator privileges... Please approve the UAC prompt."
    } catch {
        Write-Error "Failed to relaunch as Administrator. Please right-click the script and select 'Run as administrator'. Error: $($_.Exception.Message)"
    }
    exit
}

Write-Host "Running diagnostic and repair script with Administrator privileges..." -ForegroundColor Green
Write-Host "Target Host: $TargetHost`nTarget Port: $TargetPort"

# --- 1. Basic TCP Connectivity Test ---
Write-Host "`n--- Checking Basic TCP Connectivity ---`n" -ForegroundColor Cyan
Write-Host "Attempting basic TCP connection to $TargetHost on port $TargetPort..."
try {
    $tcpTest = Test-NetConnection -ComputerName $TargetHost -Port $TargetPort -InformationLevel Quiet -ErrorAction Stop
    if ($tcpTest) {
        Write-Host "TCP connection successful. (Basic connectivity OK)" -ForegroundColor Green
    } else {
        # This path might not be reached if Test-NetConnection throws on failure with -ErrorAction Stop
        Write-Warning "TCP connection test returned false (but no error thrown)."
    }
} catch {
    Write-Warning "TCP connection failed. Error: $($_.Exception.Message)"
    # Continue script execution even if TCP test fails, as other issues might be the root cause
}

# --- 2. MTU Path Discovery Test (Iterative) ---
Write-Host "`n--- Checking MTU Path Discovery (Iterative) ---`n" -ForegroundColor Cyan
$mtuSizes = @(1472, 1450, 1400, 1350, 1300, 1250) # Added 1250
$maxSuccessfulMtu = $null
$foundSuccess = $false # Track if any success occurred
foreach ($size in $mtuSizes) {
    Write-Host "Pinging $TargetHost with Don't Fragment flag and payload size $size..."
    try {
        $pingResult = ping $TargetHost -f -l $size -n 1 -w 1500 # 1.5 second timeout per ping
        Write-Host "  Output: $($pingResult -join ' | ')"
        if ($pingResult -match 'Reply from') {
            Write-Host "  Ping with size $size succeeded." -ForegroundColor Green
            if (-not $foundSuccess) { # Record the first (largest) successful size found
                 $maxSuccessfulMtu = $size
                 $foundSuccess = $true 
            }
            # Removed break to test all specified sizes
        } elseif ($pingResult -match 'Packet needs to be fragmented but DF set') {
            Write-Warning "  Ping with size $size failed: Packet needs fragmentation (MTU issue likely below $size bytes payload)."
        } elseif ($pingResult -match 'Request timed out') {
            Write-Warning "  Ping with size $size failed: Request timed out."
        } else {
             Write-Warning "  Ping with size $size failed with unexpected output."
        }
    } catch {
        Write-Warning "  An error occurred during ping test for size ${size}: $($_.Exception.Message)"
    }
    Start-Sleep -Milliseconds 200 # Short pause between pings
}

if ($maxSuccessfulMtu) {
    Write-Host "Largest successful MTU payload size (with DF flag) found in tested range: $maxSuccessfulMtu bytes." -ForegroundColor Green
} else {
    Write-Warning "Could not determine successful MTU payload size with DF flag within tested range ($($mtuSizes -join ', '))."
}

# --- 3. Check Hosts File ---
Write-Host "`n--- Checking Hosts File ---`n" -ForegroundColor Cyan
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
try {
    $hostsContent = Get-Content $hostsPath -ErrorAction Stop
    
    # Output full hosts file content
    Write-Host "--- Start of Hosts File Content ($hostsPath) ---"
    $hostsContent | Out-String | Write-Host
    Write-Host "--- End of Hosts File Content ---"

    # Check for specific entries
    $supabaseHosts = $hostsContent | Where-Object { $_ -match 'supabase\.com|pooler\.supabase\.com' -and $_ -notmatch '^\s*#' }
    if ($supabaseHosts) {
        Write-Warning "Found potentially relevant uncommented entries in '$hostsPath':"
        $supabaseHosts | ForEach-Object { Write-Warning "  $_" }
        Write-Warning "These entries might be redirecting Supabase traffic. Consider commenting them out (add '#' at the start) if they are unexpected."
    } else {
        Write-Host "No active Supabase entries found in hosts file. (OK)"
    }
} catch {
    Write-Error "Could not read hosts file at '$hostsPath'. Error: $($_.Exception.Message)"
}

# --- 4. Check and Fix Windows Time Service ---
Write-Host "`n--- Checking Windows Time Service (W32Time) ---`n" -ForegroundColor Cyan
$serviceName = "W32Time"
try {
    $timeService = Get-Service -Name $serviceName -ErrorAction Stop

    Write-Host "Service '$serviceName' found."
    Write-Host "  Current Status: $($timeService.Status)"
    Write-Host "  Startup Type: $($timeService.StartupType)"

    if ($timeService.StartupType -ne 'Automatic') {
        Write-Host "Setting Startup Type to Automatic..."
        Set-Service -Name $serviceName -StartupType Automatic -ErrorAction Stop
        Write-Host "  Startup Type set to Automatic."
    }

    if ($timeService.Status -ne 'Running') {
        Write-Host "Starting service '$serviceName'..."
        Start-Service -Name $serviceName -ErrorAction Stop
        Start-Sleep -Seconds 3 # Allow time for the service to start
        $timeService = Get-Service -Name $serviceName # Refresh status
        Write-Host "  Service started. New Status: $($timeService.Status)"
    }

    # Attempt sync only if service is running
    if ((Get-Service -Name $serviceName).Status -eq 'Running') {
        Write-Host "Attempting time resynchronization..."
        w32tm /resync /force
        Start-Sleep -Seconds 1
        Write-Host "Querying current time status:"
        w32tm /query /status /verbose
    } else {
        Write-Warning "Service '$serviceName' is not running. Skipping time resynchronization."
    }

} catch {
    Write-Error "An error occurred while managing the '$serviceName' service: $($_.Exception.Message)"
}

# --- 5. Check Firewall Rules ---
Write-Host "`n--- Checking Relevant Outbound Firewall Rules ---`n" -ForegroundColor Cyan
try {
    # Look for rules blocking the specific port or containing relevant names
    $blockingRules = Get-NetFirewallRule -Direction Outbound -Action Block -Enabled True -ErrorAction SilentlyContinue | Where-Object {
        ($_.RemotePort -contains $TargetPort) -or ($_.DisplayName -match 'postgres|supabase|6543')
    }

    if ($blockingRules) {
        Write-Warning "Found potentially relevant outbound BLOCK firewall rules:"
        $blockingRules | Format-Table DisplayName, Profile, RemotePort -AutoSize | Out-String | Write-Warning
    } else {
        Write-Host "No specific outbound BLOCK rules found for port $TargetPort or names 'postgres/supabase'. (OK)"
    }

    # Also look for Allow rules targeting the port (less likely to cause this issue, but good info)
    $allowRules = Get-NetFirewallRule -Direction Outbound -Action Allow -Enabled True -ErrorAction SilentlyContinue | Where-Object {
        ($_.RemotePort -contains $TargetPort) -or ($_.DisplayName -match 'postgres|supabase|6543')
    }
    if ($allowRules) {
        Write-Host "Found potentially relevant outbound ALLOW firewall rules:"
        $allowRules | Format-Table DisplayName, Profile, RemotePort -AutoSize | Out-String | Write-Host
    } else {
        Write-Host "No specific outbound ALLOW rules found for port $TargetPort or names 'postgres/supabase'."
    }

} catch {
    Write-Error "An error occurred while checking firewall rules: $($_.Exception.Message)"
}

# --- 6. Network Adapter Information ---
Write-Host "`n--- Checking Network Adapters ---`n" -ForegroundColor Cyan
try {
    $adapters = Get-NetAdapter | Where-Object {$_.Status -eq 'Up'}
    if ($adapters) {
        Write-Host "Active Network Adapters:"
        foreach ($adapter in $adapters) {
            Write-Host "  Name: $($adapter.Name)"
            Write-Host "    InterfaceDescription: $($adapter.InterfaceDescription)"
            Write-Host "    Status: $($adapter.Status)"
            # Get Driver Info (might require more specific filtering if multiple drivers match)
            $driver = Get-CimInstance Win32_PnPSignedDriver | Where-Object {$_.Description -eq $adapter.InterfaceDescription -or $_.DeviceName -eq $adapter.Name} | Select-Object -First 1
            if ($driver) {
                Write-Host "    Driver Version: $($driver.DriverVersion)"
                Write-Host "    Driver Date: $($driver.DriverDate)"
                Write-Host "    Manufacturer: $($driver.Manufacturer)"
            } else {
                Write-Host "    Driver Info: Not found via CIM query."
            }
        }
    } else {
        Write-Warning "No active network adapters found."
    }
} catch {
    Write-Error "An error occurred while checking network adapters: $($_.Exception.Message)"
}

# --- 7. Winsock LSP Catalog ---
Write-Host "`n--- Checking Winsock LSP Catalog ---`n" -ForegroundColor Cyan
Write-Host "Listing Layered Service Providers (LSPs)..."
try {
    # Use Invoke-Command for potentially better capture
    $lspOutput = Invoke-Command { netsh winsock show catalog }
    $lspOutput | Out-String | Write-Host
} catch {
    Write-Error "An error occurred while getting Winsock catalog: $($_.Exception.Message)"
}

# --- 8. Check TLS/SSL Protocol Settings (Client-Side) ---
Write-Host "`n--- Checking TLS/SSL Protocol Settings (Client-Side) ---`n" -ForegroundColor Cyan
$protocols = @("TLS 1.2", "TLS 1.3")
$basePath = "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols"

foreach ($protocol in $protocols) {
    $clientPath = Join-Path -Path $basePath -ChildPath "$protocol\Client"
    try {
        if (Test-Path $clientPath) {
            $enabled = Get-ItemProperty -Path $clientPath -Name "Enabled" -ErrorAction SilentlyContinue
            $disabledByDefault = Get-ItemProperty -Path $clientPath -Name "DisabledByDefault" -ErrorAction SilentlyContinue

            Write-Host "$protocol Client Settings:"
            if ($enabled -ne $null) {
                 Write-Host "  Enabled Value: $($enabled.Enabled) (0 = Disabled, 1 = Enabled)"
            } else {
                 Write-Host "  Enabled Value: Not Explicitly Set (Typically means Enabled by default)"
            }
            if ($disabledByDefault -ne $null) {
                 Write-Host "  DisabledByDefault Value: $($disabledByDefault.DisabledByDefault) (0 = Enabled, 1 = Disabled by default)"
             } else {
                 Write-Host "  DisabledByDefault Value: Not Explicitly Set (Typically means Enabled by default)"
            }
        } else {
            Write-Host "$protocol Client registry key not found (Typically means protocol is Enabled by default)."
        }
    } catch {
        Write-Error "Error checking registry for ${protocol}: $($_.Exception.Message)"
    }
}
Write-Host "Note: Default Windows settings usually enable TLS 1.2 & 1.3 unless explicitly disabled via these keys or Group Policy."

# --- 9. Attempt OpenSSL Connection Test ---
Write-Host "`n--- Attempting OpenSSL Connection Test ---`n" -ForegroundColor Cyan
$openSslLog = "$env:TEMP\openssl_test_log.txt"
Write-Host "Attempting OpenSSL s_client connection to $TargetHost`:$TargetPort..."
Write-Host "Output/Errors will be logged to: $openSslLog"
try {
    # Check if openssl exists first
    if (Get-Command openssl -ErrorAction SilentlyContinue) {
        # Redirect both stdout (1) and stderr (2) to the log file
        $cmd = "openssl s_client -connect $TargetHost`:$TargetPort -showcerts -servername $TargetHost *>&1 | Out-File -Encoding UTF8 -FilePath '$openSslLog'"
        Invoke-Expression $cmd
        Start-Sleep -Seconds 1 # Give file time to write

        if (Test-Path $openSslLog) {
            Write-Host "--- Start of OpenSSL Log Content ($openSslLog) ---"
            Get-Content $openSslLog | Out-String | Write-Host
            Write-Host "--- End of OpenSSL Log Content ---"
            # Basic check for common success/failure patterns
            $logContent = Get-Content $openSslLog -Raw
            if ($logContent -match 'Verify return code: 0 \(ok\)') {
                Write-Host "OpenSSL test indicates successful verification (Verify return code 0)." -ForegroundColor Green
            } elseif ($logContent -match 'error:|fail|unable|closed') {
                Write-Warning "OpenSSL test log contains potential error indicators."
            } else {
                 Write-Host "OpenSSL test completed, review log for details."
            }
            # Remove-Item $openSslLog -ErrorAction SilentlyContinue # Optionally cleanup log
        } else {
            Write-Warning "OpenSSL log file was not created."
        }
    } else {
        Write-Warning "OpenSSL command not found. Skipping this test."
    }
} catch {
    Write-Error "An error occurred during the OpenSSL test: $($_.Exception.Message)"
    if (Test-Path $openSslLog) {
         Write-Host "--- Start of OpenSSL Log Content ($openSslLog) [Error during script execution] ---"
         Get-Content $openSslLog | Out-String | Write-Host
         Write-Host "--- End of OpenSSL Log Content ---"
    }
}

# --- 10. Temporarily Disable Windows Defender Firewall (Active Profile) --- 
Write-Host "`n--- Temporarily Disabling Windows Defender Firewall (Active Profile) ---`n" -ForegroundColor Magenta
Write-Warning "This step will temporarily disable the Defender Firewall for your ACTIVE network profile."
Write-Warning "It will be automatically re-enabled after you press Enter."
$firewallDisabled = $false
$activeProfile = $null
try {
    # Get the active network profile
    $activeProfile = Get-NetConnectionProfile | Where-Object {$_.NetworkCategory -ne 'Invalid'} | Select-Object -First 1
    if (-not $activeProfile) {
        throw "Could not determine the active network profile."
    }
    $profileName = $activeProfile.NetworkCategory
    Write-Host "Active Network Profile Detected: $profileName"

    Write-Host "Disabling Firewall for profile '$profileName'..." -ForegroundColor Magenta
    Set-NetFirewallProfile -Profile $profileName -Enabled False -ErrorAction Stop
    $firewallDisabled = $true # Mark as disabled
    Write-Host "Firewall DISABLED for profile '$profileName'." -ForegroundColor Magenta

    Write-Host "`nNOW: Please run your connection test (e.g., 'pnpm run db:worker:migrate') in your project terminal."
    Read-Host "Press ENTER here AFTER running your test to re-enable the Firewall..."

} catch {
    Write-Error "Failed to disable Windows Defender Firewall. Error: $($_.Exception.Message)"
} finally {
    # Ensure firewall is re-enabled even if errors occurred before or during the pause
    if ($firewallDisabled -and $activeProfile) {
         Write-Host "Re-enabling Firewall for profile '$($activeProfile.NetworkCategory)'..." -ForegroundColor Green
         try {
            Set-NetFirewallProfile -Profile $activeProfile.NetworkCategory -Enabled True -ErrorAction Stop
            Write-Host "Firewall RE-ENABLED for profile '$($activeProfile.NetworkCategory)'." -ForegroundColor Green
         } catch {
             Write-Error "FAILED TO RE-ENABLE FIREWALL for profile '$($activeProfile.NetworkCategory)'. Please re-enable it manually! Error: $($_.Exception.Message)"
         }
    } elseif (-not $activeProfile -and !$PSItem) { # Avoid double error if profile detection failed
         Write-Warning "Could not determine active profile to re-enable firewall. Please check manually."
    }
}

# --- 11. Temporarily Disable Defender Real-time Protection --- 
Write-Host "`n--- Temporarily Disabling Windows Defender Real-time Protection ---`n" -ForegroundColor Magenta
Write-Warning "This step will temporarily disable Defender Real-time protection for testing."
Write-Warning "It will be automatically re-enabled after you press Enter."

try {
    Write-Host "Disabling Real-time Monitoring..." -ForegroundColor Magenta
    Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction Stop
    Write-Host "Real-time Monitoring DISABLED." -ForegroundColor Magenta

    Write-Host "`nNOW: Please run your connection test (e.g., 'pnpm run db:worker:migrate') in your project terminal."
    Read-Host "Press ENTER here AFTER running your test to re-enable Defender..."

    Write-Host "Re-enabling Real-time Monitoring..." -ForegroundColor Green
    Set-MpPreference -DisableRealtimeMonitoring $false -ErrorAction Stop
    Write-Host "Real-time Monitoring RE-ENABLED." -ForegroundColor Green

} catch {
    Write-Error "Failed to modify Windows Defender settings. Error: $($_.Exception.Message)"
    Write-Warning "Ensure Defender Real-time Monitoring is manually re-enabled if it was disabled!"
}

# --- 12. System File Checker (SFC) Scan ---
Write-Host "`n--- Running System File Checker (SFC) ---`n" -ForegroundColor Cyan
Write-Host "This check verifies the integrity of protected Windows system files and attempts repairs."
Write-Host "This process can take several minutes..."
try {
    # Run sfc /scannow. Output is verbose, capture summary if possible or just run it.
    sfc /scannow
    Write-Host "SFC scan completed. Review the output above for results." -ForegroundColor Green
    Write-Warning "If SFC reported that it repaired files, a system restart is recommended."
} catch {
    Write-Error "An error occurred while running sfc /scannow: $($_.Exception.Message)"
}

# --- 13. Reset Winsock Catalog ---
Write-Host "`n--- Resetting Winsock Catalog ---`n" -ForegroundColor Cyan
Write-Host "Executing 'netsh winsock reset' again (as part of standard procedure)..."
try {
    netsh winsock reset | Out-Null # Suppress verbose output
    Write-Host "Winsock reset command completed successfully." -ForegroundColor Green
} catch {
    Write-Error "An error occurred during Winsock reset: $($_.Exception.Message)"
}

# --- 14. Restart Prompt ---
Write-Host "`n----------------------------------------" -ForegroundColor Yellow
Write-Host " ACTION REQUIRED: System Restart" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Warning "A system restart is necessary to complete the Winsock reset."
Write-Warning "Please save any unsaved work and restart your computer now."
Write-Host "After restarting, try connecting to your Supabase database again."

Write-Host "`nScript finished. Press Enter to exit." -ForegroundColor Green
Read-Host 