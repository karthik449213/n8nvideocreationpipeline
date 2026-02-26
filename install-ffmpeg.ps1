#!/usr/bin/env pwsh
# FFmpeg Installation Helper for n8n Video Pipeline
# Run this script with: powershell -ExecutionPolicy Bypass .\install-ffmpeg.ps1

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "FFmpeg Installation Helper" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Check if FFmpeg is already installed
$ffmpegExists = $null -ne (Get-Command ffmpeg -ErrorAction SilentlyContinue)

if ($ffmpegExists) {
    Write-Host "✓ FFmpeg is already installed!" -ForegroundColor Green
    ffmpeg -version | Select-Object -First 1
    exit 0
}

Write-Host "FFmpeg not found. Choose installation method:`n" -ForegroundColor Yellow
Write-Host "Option 1: Chocolatey (requires admin rights)" -ForegroundColor Cyan
Write-Host "Option 2: Windows Installer (manual download)" -ForegroundColor Cyan
Write-Host "Option 3: Skip (use placeholder images for testing)" -ForegroundColor Cyan
Write-Host ""
$choice = Read-Host "Select option (1, 2, or 3)"

switch ($choice) {
    "1" {
        Write-Host "`nInstalling FFmpeg via Chocolatey..." -ForegroundColor Yellow
        Write-Host "NOTE: This script must be run as Administrator!" -ForegroundColor Red
        
        # Check if running as admin
        $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")
        
        if ($isAdmin) {
            choco install ffmpeg -y
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n✓ FFmpeg installed successfully!" -ForegroundColor Green
                ffmpeg -version | Select-Object -First 1
            } else {
                Write-Host "`n✗ Installation failed. Try option 2 instead." -ForegroundColor Red
            }
        } else {
            Write-Host "`n✗ This script is not running as Administrator!" -ForegroundColor Red
            Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host "`nManual FFmpeg Installation:`n" -ForegroundColor Yellow
        Write-Host "1. Download from: https://ffmpeg.org/download.html" -ForegroundColor Cyan
        Write-Host "2. Choose Windows builds (e.g., gyan.dev or Static packages)" -ForegroundColor Cyan
        Write-Host "3. Extract the archive to a permanent location, e.g.: C:\ffmpeg" -ForegroundColor Cyan
        Write-Host "4. Add FFmpeg to PATH:`n" -ForegroundColor Cyan
        
        Write-Host "   Option A (Permanent - Recommended):" -ForegroundColor Cyan
        Write-Host "   - Right-click 'This PC' or 'My Computer' > Properties" -ForegroundColor Gray
        Write-Host "   - Click 'Advanced system settings'" -ForegroundColor Gray
        Write-Host "   - Click 'Environment Variables'" -ForegroundColor Gray
        Write-Host "   - Under 'System variables', click 'New'" -ForegroundColor Gray
        Write-Host "   - Variable name: PATH_FFMPEG" -ForegroundColor Gray
        Write-Host "   - Variable value: C:\ffmpeg\bin" -ForegroundColor Gray
        Write-Host "   - Click OK and restart terminal`n" -ForegroundColor Gray
        
        Write-Host "   Option B (Temporary - Current session only):" -ForegroundColor Cyan
        Write-Host '   $env:Path += ";C:\ffmpeg\bin"' -ForegroundColor Gray
        Write-Host "   (add this to your PowerShell profile for persistence)`n" -ForegroundColor Gray
        
        Write-Host "5. Verify: ffmpeg -version" -ForegroundColor Cyan
        
        Write-Host "`nPress Enter to continue..." -ForegroundColor Yellow
        Read-Host
    }
    
    "3" {
        Write-Host "`nSkipping FFmpeg installation." -ForegroundColor Yellow
        Write-Host "You can use placeholder images for testing the workflow." -ForegroundColor Gray
        Write-Host "Install FFmpeg later when ready for production video assembly." -ForegroundColor Gray
        Write-Host ""
    }
    
    default {
        Write-Host "Invalid selection. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nDone!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
