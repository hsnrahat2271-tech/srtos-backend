$ErrorActionPreference='Stop'
$here=Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host 'SRTOS QLD A3 BACKEND - PREPARE MYSQL' -ForegroundColor Cyan
if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw 'Node.js is required.'}
if(-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)){throw 'npm.cmd is required.'}

$rng=[System.Security.Cryptography.RandomNumberGenerator]::Create()
$b=New-Object byte[] 24
$rng.GetBytes($b)
$appPassword=([Convert]::ToBase64String($b)-replace '[+/=]','')+'Aa9!'
$b2=New-Object byte[] 32
$rng.GetBytes($b2)
$jwt=([BitConverter]::ToString($b2)).Replace('-','').ToLower()

$env=@"
PORT=4173
HOST=127.0.0.1
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=srtos_app
MYSQL_PASSWORD=$appPassword
MYSQL_DATABASE=srtos_qld_a3
JWT_SECRET=$jwt
SESSION_HOURS=2
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080
NODE_ENV=development
"@
$utf8=New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $here '.env'),$env,$utf8)

$schema=Get-Content (Join-Path $here 'sql\schema.sql') -Raw
$pw=$appPassword.Replace("'","''")
$sql=@"

CREATE USER IF NOT EXISTS 'srtos_app'@'localhost' IDENTIFIED BY '$pw';
ALTER USER 'srtos_app'@'localhost' IDENTIFIED BY '$pw';
GRANT SELECT, INSERT, UPDATE, DELETE ON srtos_qld_a3.* TO 'srtos_app'@'localhost';

CREATE USER IF NOT EXISTS 'srtos_app'@'127.0.0.1' IDENTIFIED BY '$pw';
ALTER USER 'srtos_app'@'127.0.0.1' IDENTIFIED BY '$pw';
GRANT SELECT, INSERT, UPDATE, DELETE ON srtos_qld_a3.* TO 'srtos_app'@'127.0.0.1';
FLUSH PRIVILEGES;
"@
[System.IO.File]::WriteAllText((Join-Path $here 'RUN_THIS_IN_MYSQL_WORKBENCH.sql'),($schema+$sql),$utf8)
Write-Host ''
Write-Host 'BACKEND PREPARATION: PASS' -ForegroundColor Green
Write-Host 'Now execute RUN_THIS_IN_MYSQL_WORKBENCH.sql in MySQL Workbench.'
Write-Host 'Then run 02_VALIDATE_BACKEND_WINDOWS.ps1'
