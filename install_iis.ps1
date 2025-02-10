# Check if IIS is installed
$features = Get-WindowsFeature | Where-Object { $_.Name -eq "Web-Server" }
if ($features.Installed -eq $false) {
    Write-Host "IIS not installed. Installing IIS..."
    Install-WindowsFeature -Name Web-Server -IncludeManagementTools
    Write-Host "IIS installation complete."
} else {
    Write-Host "IIS is already installed."
}

# Prompt user for IIS site setup
$siteName = Read-Host "Enter the IIS Site Name (default: YTDL-Site)"
$siteName = if ($siteName -eq "") { "YTDL-Site" } else { $siteName }

$appPath = Read-Host "Enter the Application Directory (default: C:\inetpub\ytdl)"
$appPath = if ($appPath -eq "") { "C:\inetpub\ytdl" } else { $appPath }

# Create IIS Site
New-WebSite -Name $siteName -PhysicalPath $appPath -Port 3000 -Force

Write-Host "IIS site '$siteName' created successfully."
