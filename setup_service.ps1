$serviceName = "YTDLService"
$appPath = "C:\inetpub\ytdl"
$nodePath = "C:\Program Files\nodejs\node.exe"
$script = "$appPath\app.js"

# Check if the service exists
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -eq $null) {
    Write-Host "Creating Windows service for YTDL..."
    New-Service -Name $serviceName -BinaryPathName "`"$nodePath`" `"$script`"" -DisplayName "YT-DL Node.js Service" -Description "Runs YTDL as a service"
    Start-Service -Name $serviceName
    Write-Host "Service created and started successfully."
} else {
    Write-Host "Service already exists. Restarting service..."
    Restart-Service -Name $serviceName
}
