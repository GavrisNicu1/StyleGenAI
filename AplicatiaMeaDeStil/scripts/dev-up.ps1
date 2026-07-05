param(
    [switch]$NoExpo
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host '[1/3] Starting backend container...' -ForegroundColor Cyan
docker compose up -d --build

Write-Host '[2/3] Checking backend health...' -ForegroundColor Cyan
$healthUrl = 'http://localhost:5000/health'
$maxAttempts = 20
$ok = $false

for ($i = 1; $i -le $maxAttempts; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 2
        if ($resp.status -eq 'ok') {
            $ok = $true
            break
        }
    }
    catch {
        Start-Sleep -Milliseconds 600
    }
}

if (-not $ok) {
    Write-Host 'Backend did not become healthy in time. Check logs with: docker compose logs -f backend' -ForegroundColor Red
    exit 1
}

Write-Host 'Backend is healthy at http://localhost:5000/health' -ForegroundColor Green

if ($NoExpo) {
    Write-Host '[3/3] Expo start skipped (-NoExpo).' -ForegroundColor Yellow
    exit 0
}

Write-Host '[3/3] Starting Expo in LAN mode...' -ForegroundColor Cyan
npx expo start --lan -c
