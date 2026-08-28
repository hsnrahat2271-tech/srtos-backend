$ErrorActionPreference='Stop'
$here=Split-Path -Parent $MyInvocation.MyCommand.Path
if(-not (Test-Path (Join-Path $here '.env'))){throw 'Run 01 preparation first.'}
Set-Location $here
Write-Host 'Starting account API on http://127.0.0.1:4173' -ForegroundColor Green
npm.cmd start
