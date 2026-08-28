$ErrorActionPreference='Stop'
$here=Split-Path -Parent $MyInvocation.MyCommand.Path
if(-not (Test-Path (Join-Path $here '.env'))){throw 'Run 01_PREPARE_BACKEND_WINDOWS.ps1 first.'}
Push-Location $here
try{
  npm.cmd install
  if($LASTEXITCODE -ne 0){throw 'npm install failed.'}
  npm.cmd run check
  if($LASTEXITCODE -ne 0){throw 'Backend syntax check failed.'}
  npm.cmd run check:schema
  if($LASTEXITCODE -ne 0){throw 'Schema check failed.'}
  npm.cmd test
  if($LASTEXITCODE -ne 0){throw 'Backend tests failed.'}
  npm.cmd run smoke:mysql
  if($LASTEXITCODE -ne 0){throw 'Real MySQL smoke test failed.'}
}finally{Pop-Location}
Write-Host ''
Write-Host 'BACKEND + MYSQL VALIDATION: PASS' -ForegroundColor Green
