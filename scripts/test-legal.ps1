param(
  [string]$PostgresBin = 'C:\Program Files\PostgreSQL\18\bin',
  [int]$Port = 55482,
  [string]$NodeExe = 'node'
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$results = Join-Path $root 'test-results'
$cluster = Join-Path $results ('legal-pg-' + [guid]::NewGuid().ToString('N'))
$database = 'legal_orm_test_' + [guid]::NewGuid().ToString('N').Substring(0, 8)
$started = $false
$settings = @{
  LEGAL_TEST_HOST = '127.0.0.1'
  LEGAL_TEST_PORT = "$Port"
  LEGAL_TEST_DATABASE = $database
  LEGAL_TEST_USER = 'legal_test'
  LEGAL_TEST_PASSWORD = 'local-test'
  DATABASE_HOST = '127.0.0.1'
  DATABASE_PORT = "$Port"
  DATABASE_NAME = $database
  DATABASE_USER = 'legal_test'
  DATABASE_PASSWORD = 'local-test'
  DATABASE_SSL = 'false'
  NODE_ENV = 'test'
  FORM_DRAFT_STATE_CODE = 'BORRADOR'
  FORM_CONFIRMED_STATE_CODE = 'CONFIRMADO'
  FORM_DISCARDED_STATE_CODE = 'DESCARTADO'
  AUDIT_ACTOR_USERNAME = 'laboratorio-local'
}
$names = @($settings.Keys)
$previous = @{}
foreach ($name in $names) { $previous[$name] = [Environment]::GetEnvironmentVariable($name) }
if ((& $NodeExe --version) -notmatch '^v24\.') { throw 'Usar Node.js 24 según CONTRIBUTING.md.' }
if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) {
  throw "El puerto local $Port está ocupado; elegir otro puerto de ensayo."
}
New-Item -ItemType Directory -Path $results -Force | Out-Null
Push-Location $root
try {
  & (Join-Path $PostgresBin 'initdb.exe') -D $cluster -U legal_test -A trust --encoding=UTF8 --locale=C | Out-File (Join-Path $results 'legal-initdb.log')
  if ($LASTEXITCODE -ne 0) { throw 'Falló la creación del PostgreSQL desechable.' }
  # El servidor no hereda los canales de la terminal de pruebas.
  $startOptions = @{
    FilePath = Join-Path $PostgresBin 'pg_ctl.exe'
    WindowStyle = 'Hidden'
    PassThru = $true
    ArgumentList = @('-D',('"' + $cluster + '"'),'-l',('"' + (Join-Path $cluster 'server.log') + '"'),'-o',('"-p ' + $Port + ' -h 127.0.0.1"'),'-w','start')
    RedirectStandardOutput = Join-Path $results 'legal-pg-start.log'
    RedirectStandardError = Join-Path $results 'legal-pg-start-error.log'
  }
  $control = Start-Process @startOptions
  $control.WaitForExit()
  & (Join-Path $PostgresBin 'pg_ctl.exe') -D $cluster status | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'No inició el servidor PostgreSQL de ensayo.' }
  $started = $true
  & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p $Port -U legal_test $database
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la base de ensayo.' }
  $files = @(
    'test/fixtures/01_new_horizons_postgresql.sql',
    'test/fixtures/seed-local.sql',
    'test/fixtures/fixture-migracion-test.sql',
    'test/fixtures/02_ampliacion_formularios.sql'
  )
  $files += Get-ChildItem database/migrations -Filter '*.sql' | Sort-Object Name | ForEach-Object FullName
  $files += 'test/fixtures/legal.sql'
  foreach ($file in $files) {
    & (Join-Path $PostgresBin 'psql.exe') -h 127.0.0.1 -p $Port -U legal_test -d $database -v ON_ERROR_STOP=1 -q -f $file 2>&1 | Out-File (Join-Path $results 'legal-schema.log') -Append
    if ($LASTEXITCODE -ne 0) { throw "Falló el script de ensayo $file" }
  }
  foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $settings[$name]) }
  $suites = @('test/legal-orm.integration.cjs')
  $report = 'legal.integration.tap'
  foreach ($suite in $suites) {
    if (-not (Test-Path -LiteralPath $suite -PathType Leaf)) {
      throw "No existe el archivo de pruebas requerido: $suite"
    }
  }
  & $NodeExe --test --test-concurrency=1 @suites 2>&1 | Tee-Object (Join-Path $results $report)
  if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas de Legal.' }
} finally {
  if ($started) {
    # Sólo se detiene el clúster propio; no se elimina ningún directorio.
    & (Join-Path $PostgresBin 'pg_ctl.exe') -D $cluster -m fast -w stop | Out-Null
  }
  foreach ($name in $names) {
    if ($null -eq $previous[$name]) {
      Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
    } else {
      [Environment]::SetEnvironmentVariable($name, $previous[$name])
    }
  }
  Pop-Location
}
