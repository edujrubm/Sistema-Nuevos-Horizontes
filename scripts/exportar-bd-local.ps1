param([int]$Port=55452,[string]$PostgresBin='C:\Program Files\PostgreSQL\18\bin')
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$dest=Join-Path $root 'database/export'
New-Item -ItemType Directory -Path $dest -Force | Out-Null
& (Join-Path $PostgresBin 'pg_dump.exe') -h 127.0.0.1 -p $Port -U areas_test -d areas_test --no-owner --no-acl --schema-only -f (Join-Path $dest 'esquema-local.sql')
if($LASTEXITCODE -ne 0){throw 'Falló exportación de esquema'}
& (Join-Path $PostgresBin 'pg_dump.exe') -h 127.0.0.1 -p $Port -U areas_test -d areas_test --no-owner --no-acl -f (Join-Path $dest 'laboratorio-datos-sinteticos.sql')
if($LASTEXITCODE -ne 0){throw 'Falló exportación completa'}
Write-Host "Exportaciones locales en $dest"
