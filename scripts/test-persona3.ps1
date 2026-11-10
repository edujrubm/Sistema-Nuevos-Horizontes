param([string]$PostgresBin='C:\Program Files\PostgreSQL\18\bin',[int]$Port=55461,[switch]$SinLaboratorio)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$results=Join-Path $root 'test-results'
New-Item -ItemType Directory $results -Force | Out-Null
$cluster=Join-Path $results ('pg-'+[guid]::NewGuid().ToString('N'))
$started=$false
$names=@('DATABASE_HOST','DATABASE_PORT','DATABASE_NAME','DATABASE_USER','DATABASE_PASSWORD','DATABASE_SSL','NODE_ENV','P3_TEST_ACTOR_ID','P3_DRAFT_STATE','P3_CONFIRMED_STATE','P3_TEST_AREA','P3_TEST_ROLE','P3_DOCUMENTS_DIR','P3_ENABLE_LAB','FORM_DRAFT_STATE_CODE','FORM_CONFIRMED_STATE_CODE','AUDIT_ACTOR_USERNAME')
$previous=@{}
foreach($name in $names){$previous[$name]=[Environment]::GetEnvironmentVariable($name)}
Push-Location $root
try {
 & (Join-Path $PostgresBin 'initdb.exe') -D $cluster -U p3_test -A trust --encoding=UTF8 --locale=C | Out-File (Join-Path $results 'initdb.txt')
 if($LASTEXITCODE -ne 0){throw 'Falló initdb'}
 & (Join-Path $PostgresBin 'pg_ctl.exe') -D $cluster -l (Join-Path $cluster 'postgres.log') -o "-p $Port -h 127.0.0.1" -w start
 if($LASTEXITCODE -ne 0){throw 'Falló inicio PostgreSQL'}
 $started=$true
 & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p $Port -U p3_test p3_test
 if($LASTEXITCODE -ne 0){throw 'Falló createdb'}
 $sqlFiles=@('test/fixtures/01_new_horizons_postgresql.sql','test/fixtures/seed-local.sql','test/fixtures/fixture-migracion-test.sql','test/fixtures/02_ampliacion_formularios.sql')
 $sqlFiles+=Get-ChildItem -LiteralPath (Join-Path $root 'database/migrations') -Filter '*.sql' | Sort-Object Name | ForEach-Object { 'database/migrations/'+$_.Name }

 $sqlFiles+='test/fixtures/persona3.sql'
 foreach($file in $sqlFiles){
  & (Join-Path $PostgresBin 'psql.exe') -h 127.0.0.1 -p $Port -U p3_test -d p3_test -v ON_ERROR_STOP=1 -q -f (Join-Path $root $file) 2>&1 | Out-File (Join-Path $results ([IO.Path]::GetFileName($file)+'.log'))
  if($LASTEXITCODE -ne 0){throw "Falló $file"}
 }
 $env:P3_DOCUMENTS_DIR=Join-Path $cluster 'documentos-privados'
 $env:P3_ENABLE_LAB='false'
 $env:FORM_DRAFT_STATE_CODE='P3_BORRADOR';$env:FORM_CONFIRMED_STATE_CODE='P3_CONFIRMADO';$env:AUDIT_ACTOR_USERNAME='laboratorio-local'
 $env:DATABASE_HOST='127.0.0.1';$env:DATABASE_PORT="$Port";$env:DATABASE_NAME='p3_test';$env:DATABASE_USER='p3_test';$env:DATABASE_PASSWORD='local-test';$env:DATABASE_SSL='false';$env:NODE_ENV='test';$env:P3_TEST_ACTOR_ID='1';$env:P3_DRAFT_STATE='P3_BORRADOR';$env:P3_CONFIRMED_STATE='P3_CONFIRMADO';$env:P3_TEST_AREA='Legal';$env:P3_TEST_ROLE='COORDINACION'
 & pnpm run build
 if($LASTEXITCODE -ne 0){throw 'Falló compilación'}
 $suites=@('test/errores.unit.cjs','test/persona3.integration.cjs')

 $suites+='test/zzz-documentos-unificados.integration.cjs'
 & node --test --test-concurrency=1 @suites 2>&1 | Tee-Object -FilePath (Join-Path $results 'persona3.tap')
 if($LASTEXITCODE -ne 0){throw 'Fallaron las pruebas'}
} finally {
 if($started){& (Join-Path $PostgresBin 'pg_ctl.exe') -D $cluster -m fast -w stop}
 foreach($name in $names){[Environment]::SetEnvironmentVariable($name,$previous[$name])}
 Pop-Location
}
