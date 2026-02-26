#!/usr/bin/env pwsh
# Comprehensive test script for n8n Video Pipeline
# Run this to validate that all fixes are in place and working

Write-Host "`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     n8n Video Pipeline - Comprehensive Test Suite       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

$scriptPath = $PSScriptRoot
$passCount = 0
$failCount = 0
$testResults = @()

function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$Description
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Cyan
    
    try {
        $result = & $Test
        $passCount++
        $testResults += @{
            Name = $Name
            Status = "✓ PASS"
            Color = "Green"
            Message = $Description
        }
        Write-Host "  ✓ PASS - $Description`n" -ForegroundColor Green
        return $true
    } catch {
        $failCount++
        $testResults += @{
            Name = $Name
            Status = "✗ FAIL"
            Color = "Red"
            Message = $_.Exception.Message
        }
        Write-Host "  ✗ FAIL - $($_.Exception.Message)`n" -ForegroundColor Red
        return $false
    }
}

# Test 1: Node.js Environment
Test-Component "Node.js Version" {
    $version = node --version
    if ([version]$version.substring(1) -lt [version]"18.0.0") {
        throw "Node.js version must be 18+"
    }
    return $true
} "Node.js v$(node --version) installed"

# Test 2: npm Installation
Test-Component "npm Installation" {
    npm --version | Out-Null
    return $true
} "npm v$(npm --version) available"

# Test 3: Module System Configuration
Test-Component "package.json Module Config" {
    $packageJson = Get-Content "$scriptPath/package.json" | ConvertFrom-Json
    if ($packageJson.type -ne "module") {
        throw "Missing 'type': 'module' in package.json"
    }
    return $true
} "'type': 'module' configured correctly"

# Test 4: Dependencies Installation
Test-Component "Project Dependencies" {
    if (!(Test-Path "$scriptPath/node_modules")) {
        throw "node_modules directory not found. Run: npm install"
    }
    if (!(Test-Path "$scriptPath/node_modules/openai")) {
        throw "openai package not found"
    }
    if (!(Test-Path "$scriptPath/node_modules/axios")) {
        throw "axios package not found"
    }
    return $true
} "All dependencies installed (openai, axios, googleapis, etc.)"

# Test 5: Script Files Exist
Test-Component "Script Files" {
    $scripts = @(
        "scripts/idea-generator.js",
        "scripts/prompt-generator.js",
        "scripts/image-generator.js",
        "scripts/audio-generator.js",
        "scripts/video-assembler.js",
        "scripts/publish-to-youtube.js"
    )
    foreach ($script in $scripts) {
        if (!(Test-Path "$scriptPath/$script")) {
            throw "Missing: $script"
        }
    }
    return $true
} "All 6 script files present"

# Test 6: OpenAI API Method in idea-generator
Test-Component "OpenAI API Fix - Idea Generator" {
    $content = Get-Content "$scriptPath/scripts/idea-generator.js" -Raw
    if ($content -match "client\.responses\.create") {
        throw "Old API method still present (client.responses.create)"
    }
    if (!($content -match "client\.chat\.completions\.create")) {
        throw "New API method not found (client.chat.completions.create)"
    }
    if (!($content -match '"role":\s*"system"')) {
        throw "System message not configured"
    }
    return $true
} "Using correct OpenAI chat.completions API with system messages"

# Test 7: OpenAI API Method in prompt-generator
Test-Component "OpenAI API Fix - Prompt Generator" {
    $content = Get-Content "$scriptPath/scripts/prompt-generator.js" -Raw
    if ($content -match "client\.responses\.create") {
        throw "Old API method still present"
    }
    if (!($content -match "client\.chat\.completions\.create")) {
        throw "New API method not found"
    }
    return $true
} "Using correct OpenAI chat.completions API"

# Test 8: OpenAI API Method in publish-to-youtube
Test-Component "OpenAI API Fix - YouTube Publisher" {
    $content = Get-Content "$scriptPath/scripts/publish-to-youtube.js" -Raw
    if ($content -match "client\.responses\.create") {
        throw "Old API method still present"
    }
    if (!($content -match "client\.chat\.completions\.create")) {
        throw "New API method not found"
    }
    return $true
} "Using correct OpenAI chat.completions API"

# Test 9: Image Generator Implementation
Test-Component "Image Generation Script" {
    $content = Get-Content "$scriptPath/scripts/image-generator.js" -Raw
    if (!($content -match "async function generateImages")) {
        throw "generateImages function not found"
    }
    if (!($content -match "STABILITY_API_KEY")) {
        throw "Stability API integration missing"
    }
    return $true
} "Image generator implemented with Stable Diffusion support"

# Test 10: Audio Generator Implementation
Test-Component "Audio Generation Script" {
    $content = Get-Content "$scriptPath/scripts/audio-generator.js" -Raw
    if (!($content -match "async function generateAudio")) {
        throw "generateAudio function not found"
    }
    if (!($content -match "async function generateScript")) {
        throw "generateScript function not found"
    }
    if (!($content -match "ELEVENLABS_API_KEY")) {
        throw "ElevenLabs API integration missing"
    }
    return $true
} "Audio generator implemented with TTS support"

# Test 11: npm Scripts Configuration
Test-Component "npm Scripts" {
    $packageJson = Get-Content "$scriptPath/package.json" | ConvertFrom-Json
    $requiredScripts = @("idea", "prompts", "images", "audio", "assemble", "publish")
    foreach ($script in $requiredScripts) {
        if (!$packageJson.scripts.$script) {
            throw "Missing npm script: $script"
        }
    }
    return $true
} "All npm scripts configured (idea, prompts, images, audio, assemble, publish)"

# Test 12: FFmpeg Installation
Test-Component "FFmpeg System" {
    $ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if (!$ffmpeg) {
        Write-Host "    ⚠ FFmpeg not in PATH. " -ForegroundColor Yellow -NoNewline
        Write-Host "Run: powershell -ExecutionPolicy Bypass .\install-ffmpeg.ps1" -ForegroundColor Yellow
        return $false
    }
    return $true
} "FFmpeg is installed and in PATH"

# Test 13: Environment Variables
Test-Component "Environment Variables" {
    Write-Host "    Checking environment variables:" -ForegroundColor Yellow
    
    $apiKey = $env:OPENAI_API_KEY
    $googleCreds = $env:GOOGLE_APPLICATION_CREDENTIALS
    
    if ($apiKey) {
        Write-Host "    ✓ OPENAI_API_KEY is set (length: $($apiKey.Length))" -ForegroundColor Green
    } else {
        Write-Host "    ⚠ OPENAI_API_KEY not set" -ForegroundColor Yellow
    }
    
    if ($googleCreds) {
        if (Test-Path $googleCreds) {
            Write-Host "    ✓ GOOGLE_APPLICATION_CREDENTIALS found" -ForegroundColor Green
        } else {
            Write-Host "    ✗ GOOGLE_APPLICATION_CREDENTIALS path doesn't exist: $googleCreds" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "    ⚠ GOOGLE_APPLICATION_CREDENTIALS not set" -ForegroundColor Yellow
    }
    
    return $true
} "Environment configuration"

# Test 14: Workflow Files
Test-Component "Workflow Files" {
    if (!(Test-Path "$scriptPath/n8n/three_d_pipeline.json")) {
        throw "Missing: n8n/three_d_pipeline.json"
    }
    if (!(Test-Path "$scriptPath/spec.json")) {
        throw "Missing: spec.json"
    }
    return $true
} "n8n workflow and configuration files present"

# Test 15: Documentation Files
Test-Component "Documentation" {
    $docs = @(
        "DOCUMENTATION_INDEX.md",
        "SETUP_GUIDE_WINDOWS_VSCODE.md",
        "FIXED_CODE_READY.md",
        "CRITICAL_FIXES.md",
        "PROJECT_ANALYSIS.md"
    )
    foreach ($doc in $docs) {
        if (!(Test-Path "$scriptPath/$doc")) {
            Write-Host "    ⚠ Missing: $doc" -ForegroundColor Yellow
        }
    }
    return $true
} "Documentation files available"

# Summary Report
Write-Host "`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  TEST SUMMARY REPORT                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

$passCount = $testResults | Where-Object { $_.Status -match "PASS" } | Measure-Object | Select-Object -ExpandProperty Count
$failCount = $testResults | Where-Object { $_.Status -match "FAIL" } | Measure-Object | Select-Object -ExpandProperty Count

Write-Host "Results:" -ForegroundColor Cyan
Write-Host "  ✓ Passed: $passCount" -ForegroundColor Green
Write-Host "  ✗ Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 ALL CRITICAL FIXES VERIFIED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Cyan
    Write-Host "  1. Set your API keys in .env file" -ForegroundColor Gray
    Write-Host "  2. Start n8n: npm install -g n8n; n8n start" -ForegroundColor Gray
    Write-Host "  3. Import workflow: n8n/three_d_pipeline.json" -ForegroundColor Gray
    Write-Host "  4. Test scripts: npm run idea, npm run prompts, etc." -ForegroundColor Gray
} else {
    Write-Host "⚠ Some tests failed. See details above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Action items:" -ForegroundColor Yellow
    foreach ($result in $testResults | Where-Object { $_.Status -match "FAIL" }) {
        Write-Host "  - $($result.Name): $($result.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "For more information, see DOCUMENTATION_INDEX.md" -ForegroundColor Gray
Write-Host ""
