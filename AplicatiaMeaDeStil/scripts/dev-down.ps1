$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host 'Stopping backend container...' -ForegroundColor Cyan
docker compose down

Write-Host 'Done.' -ForegroundColor Green
