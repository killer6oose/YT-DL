# Check if Node.js is installed
$node = Get-Command node -ErrorAction SilentlyContinue

if ($node -eq $null) {
    Write-Host "Node.js not found. Fetching latest version..."

    # Fetch the latest Node.js LTS release
    $latestVersion = Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json" | 
                     Where-Object { $_.lts -eq $true } | 
                     Select-Object -First 1 -ExpandProperty version
                     
    $nodeInstaller = "https://nodejs.org/dist/$latestVersion/node-$latestVersion-x64.msi"
    $nodePath = "$env:TEMP\node-latest-x64.msi"

    Write-Host "Downloading Node.js LTS version: $latestVersion..."
    Invoke-WebRequest -Uri $nodeInstaller -OutFile $nodePath

    # Install Node.js
    Write-Host "Installing Node.js..."
    Start-Process msiexec.exe -ArgumentList "/i `"$nodePath`" /quiet /norestart" -Wait

    Write-Host "Node.js installation complete."
} else {
    Write-Host "Node.js is already installed."
}
