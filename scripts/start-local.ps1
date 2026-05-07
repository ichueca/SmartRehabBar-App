param(
  [switch]$RebuildFrontend,
  [int]$Port = 5000
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'
$backendEnvPath = Join-Path $backendPath '.env'
$frontendDistPath = Join-Path $frontendPath 'dist'
$prismaClientPath = Join-Path $backendPath 'node_modules\.prisma\client\index.js'
$backendDataPath = Join-Path $backendPath 'data'

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "No se ha encontrado el comando requerido: $name"
  }
}

function Run-Step($workingDir, [scriptblock]$script, $description) {
  Write-Host "`n> $description" -ForegroundColor Cyan
  Push-Location $workingDir
  try {
    & $script
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
      throw "El comando falló con código $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}

Write-Host "SmartRehabBar - Arranque local unificado" -ForegroundColor Green
Write-Host "Repositorio: $repoRoot"

Assert-Command node
Assert-Command npm
Assert-Command npx

if (-not (Test-Path $backendEnvPath)) {
  throw "No existe backend/.env. Ejecuta primero .\scripts\install-local.ps1"
}

if (-not (Test-Path $backendDataPath)) {
  New-Item -ItemType Directory -Path $backendDataPath | Out-Null
}

if ($RebuildFrontend -or -not (Test-Path $frontendDistPath)) {
  Run-Step $frontendPath { npm run build } 'Compilando frontend'
}
else {
  Write-Host "`nOK: Build del frontend ya disponible. Usa -RebuildFrontend para recompilar." -ForegroundColor Green
}

if (-not (Test-Path $prismaClientPath)) {
  Run-Step $backendPath { npx prisma generate } 'Generando cliente Prisma'
}
else {
  Write-Host "`nOK: Cliente Prisma ya disponible. Se omite la regeneracion." -ForegroundColor Green
}

Run-Step $backendPath { npx prisma migrate deploy } 'Verificando migraciones'

$env:NODE_ENV = 'production'
$env:PORT = "$Port"

Write-Host "`nOK: Arrancando SmartRehabBar en modo local unificado" -ForegroundColor Green
Write-Host "Aplicación disponible en: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Pulsa Ctrl+C para detener el servidor.`n" -ForegroundColor Yellow

Push-Location $backendPath
try {
  node src/server.js
}
finally {
  Pop-Location
}
