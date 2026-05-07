param(
  [switch]$ForceInstall
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'
$backendEnvPath = Join-Path $backendPath '.env'
$backendEnvExamplePath = Join-Path $backendPath '.env.example'
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

Write-Host "SmartRehabBar - Instalacion local" -ForegroundColor Green
Write-Host "Repositorio: $repoRoot"

Assert-Command node
Assert-Command npm
Assert-Command npx

if (-not (Test-Path $backendEnvPath)) {
  Copy-Item $backendEnvExamplePath $backendEnvPath
  Write-Host "`nINFO: Se ha creado backend/.env a partir de .env.example" -ForegroundColor Yellow
}
else {
  Write-Host "`nINFO: backend/.env ya existe; se mantiene la configuracion actual" -ForegroundColor Yellow
}

if (-not (Test-Path $backendDataPath)) {
  New-Item -ItemType Directory -Path $backendDataPath | Out-Null
  Write-Host "`nINFO: Se ha creado la carpeta backend/data para SQLite" -ForegroundColor Yellow
}

$backendNodeModules = Join-Path $backendPath 'node_modules'
$frontendNodeModules = Join-Path $frontendPath 'node_modules'
$prismaClientPath = Join-Path $backendPath 'node_modules\.prisma\client\index.js'

if ($ForceInstall -or -not (Test-Path $backendNodeModules)) {
  Run-Step $backendPath { npm install --no-fund } 'Instalando dependencias del backend'
}
else {
  Write-Host "`nOK: Dependencias del backend ya presentes. Usa -ForceInstall para reinstalar." -ForegroundColor Green
}

if ($ForceInstall -or -not (Test-Path $frontendNodeModules)) {
  Run-Step $frontendPath { npm install --no-fund } 'Instalando dependencias del frontend'
}
else {
  Write-Host "`nOK: Dependencias del frontend ya presentes. Usa -ForceInstall para reinstalar." -ForegroundColor Green
}

if (-not (Test-Path $prismaClientPath)) {
  Run-Step $backendPath { npx prisma generate } 'Generando cliente Prisma'
}
else {
  Write-Host "`nOK: Cliente Prisma ya disponible. Se omite la regeneracion." -ForegroundColor Green
}

Run-Step $backendPath { npx prisma migrate deploy } 'Aplicando migraciones de base de datos'

Write-Host "`nOK: Instalacion local completada correctamente" -ForegroundColor Green
Write-Host "Siguiente paso recomendado:" -ForegroundColor Cyan
Write-Host "powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1"
