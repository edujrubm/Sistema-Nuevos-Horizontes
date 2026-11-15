param([string]$PostgresBin='C:\Program Files\PostgreSQL\18\bin',[int]$Port=55462,[int]$ApiPort=3016,[ValidateSet('Legal','Trabajo Social','Guardería','Psicología','Medicina','Albergue')][string]$Area='Legal')
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$results=Join-Path $root 'test-results'
New-Item -ItemType Directory $results -Force | Out-Null
$cluster=Join-Path $results 'local-mockups-pg'
$marker=Join-Path $cluster '.integracion-documentos-008-initialized'
$started=$false
$names=@('DATABASE_HOST','DATABASE_PORT','DATABASE_NAME','DATABASE_USER','DATABASE_PASSWORD','DATABASE_SSL','NODE_ENV','AUDIT_TEST_ACTOR_ID','FORM_DRAFT_STATE_CODE','FORM_CONFIRMED_STATE_CODE','AREA_TEST_NOMBRE','AREA_TEST_ROL','DOCUMENTOS_DIR','AREA_ENABLE_LAB','PORT','FORM_DRAFT_STATE_CODE','FORM_CONFIRMED_STATE_CODE','AUDIT_ACTOR_USERNAME')
$previous=@{}
foreach($name in $names){$previous[$name]=[Environment]::GetEnvironmentVariable($name)}
Push-Location $root
try {
 if(!(Test-Path (Join-Path $cluster 'PG_VERSION'))){
 & (Join-Path $PostgresBin 'initdb.exe') -D $cluster -U areas_test -A trust --encoding=UTF8 --locale=C | Out-File (Join-Path $results 'initdb.txt')
 if($LASTEXITCODE -ne 0){throw 'Falló initdb'}
 }
 & (Join-Path $PostgresBin 'pg_ctl.exe') -D $cluster -l (Join-Path $results 'postgres-demo.log') -o "-p $Port -h 127.0.0.1" -w start
 if($LASTEXITCODE -ne 0){throw 'Falló inicio PostgreSQL'}
 $started=$true
 if(!(Test-Path $marker)){
 & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p $Port -U areas_test areas_test
 if($LASTEXITCODE -ne 0){throw 'Falló createdb'}
 $sqlFiles=@('test/fixtures/01_new_horizons_postgresql.sql','test/fixtures/seed-local.sql','test/fixtures/fixture-migracion-test.sql','test/fixtures/02_ampliacion_formularios.sql')
 $sqlFiles+=Get-ChildItem -LiteralPath (Join-Path $root 'database/migrations') -Filter '*.sql' | Sort-Object Name | ForEach-Object { 'database/migrations/'+$_.Name }
 $sqlFiles+='test/fixtures/registros-area.sql'
 $sqlFiles+='test/fixtures/persona4-demo.sql'
 foreach($file in $sqlFiles){
  & (Join-Path $PostgresBin 'psql.exe') -h 127.0.0.1 -p $Port -U areas_test -d areas_test -v ON_ERROR_STOP=1 -q -f (Join-Path $root $file) 2>&1 | Out-File (Join-Path $results ([IO.Path]::GetFileName($file)+'.log'))
  if($LASTEXITCODE -ne 0){throw "Falló $file"}
 }
 Set-Content $marker 'Solo datos sintéticos registros-area'
 }
 $env:PORT="$ApiPort"
 $env:DOCUMENTOS_DIR=Join-Path $results 'documentos-locales'
 $env:AREA_ENABLE_LAB='false'
 $env:FORM_DRAFT_STATE_CODE='BORRADOR';$env:FORM_CONFIRMED_STATE_CODE='CONFIRMADO';$env:AUDIT_ACTOR_USERNAME='laboratorio-local'
 $env:DATABASE_HOST='127.0.0.1';$env:DATABASE_PORT="$Port";$env:DATABASE_NAME='areas_test';$env:DATABASE_USER='areas_test';$env:DATABASE_PASSWORD='local-test';$env:DATABASE_SSL='false';$env:NODE_ENV='test';$env:AUDIT_TEST_ACTOR_ID='1';$env:FORM_DRAFT_STATE_CODE='BORRADOR';$env:FORM_CONFIRMED_STATE_CODE='CONFIRMADO';$env:AREA_TEST_NOMBRE=$Area;$env:AREA_TEST_ROL='COORDINACION'
 & pnpm run build
 if($LASTEXITCODE -ne 0){throw 'Falló compilación'}
 Write-Host "módulos de área: http://127.0.0.1:$ApiPort/api/v1 - Ctrl+C para detener"
 & node dist/main.js
 if($LASTEXITCODE -ne 0){throw 'El servidor terminó con error'}
} finally {
 if($started){& (Join-Path $PostgresBin 'pg_ctl.exe') -D $cluster -m fast -w stop}
 foreach($name in $names){[Environment]::SetEnvironmentVariable($name,$previous[$name])}
 Pop-Location
}
