$hostName = "aws-0-us-east-1.pooler.supabase.com"
$port = 6543
$timeoutMilliseconds = 5000 # 5 seconds

try {
    Write-Host "Attempting to connect to $hostName on port $port..."
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connectTask = $tcpClient.ConnectAsync($hostName, $port)

    if (-not $connectTask.Wait($timeoutMilliseconds)) {
        throw "Connection timed out after $($timeoutMilliseconds / 1000) seconds."
    }

    if (-not $tcpClient.Connected) {
         throw "Failed to establish TCP connection."
    }

    Write-Host "TCP connection established. Attempting SSL handshake..."
    # Force TLS 1.2 or higher, as older versions might be blocked or cause issues
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12, [System.Net.SecurityProtocolType]::Tls13

    $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream(), $false) # Leave inner stream open = $false

    # The Server Name Indication (SNI) hostname MUST match the certificate hostname
    $sslStream.AuthenticateAsClient($hostName)

    if ($sslStream.IsAuthenticated) {
        Write-Host "SSL handshake successful!"
        Write-Host "Server Certificate Details:"
        Write-Host "  Subject: $($sslStream.RemoteCertificate.Subject)"
        Write-Host "  Issuer: $($sslStream.RemoteCertificate.Issuer)"
        Write-Host "  Expiration Date: $($sslStream.RemoteCertificate.GetExpirationDateString())"
        Write-Host "  Effective Date: $($sslStream.RemoteCertificate.GetEffectiveDateString())"
        # You can add more properties if needed, e.g., $sslStream.RemoteCertificate.Thumbprint
    } else {
        Write-Host "SSL handshake failed."
    }

    $sslStream.Close()
    $tcpClient.Close()

} catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    if ($tcpClient -ne $null -and $tcpClient.Connected) {
        $tcpClient.Close()
    }
} finally {
    # Dispose objects if they were created
    if ($sslStream -ne $null) { $sslStream.Dispose() }
    if ($tcpClient -ne $null) { $tcpClient.Dispose() }
} 