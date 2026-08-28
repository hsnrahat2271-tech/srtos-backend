SRTOS QLD A3 — RAHAT BACKEND + MYSQL PACKAGE
=============================================

This ZIP contains the Assessment 3 backend separately from the frontend.

Backend:
- Node.js API
- MySQL 8
- bcrypt password hashing
- signed JWT in HttpOnly session cookie
- per-user ownership/isolation
- profile persistence
- saved/favourite routes
- alert preferences
- alerts
- notifications

MySQL tables:
users
profiles
saved_routes
alert_preferences
alerts
notifications

IMPORTANT:
Do not send/share the generated .env file.
Do not expose MySQL passwords, JWT secret or password_hash in screenshots.

GIT BASH:
1. ./01_PREPARE_BACKEND_GIT_BASH.sh
2. Open RUN_THIS_IN_MYSQL_WORKBENCH.sql in MySQL Workbench and execute it once.
3. ./02_VALIDATE_BACKEND_GIT_BASH.sh
4. ./03_START_BACKEND_GIT_BASH.sh

POWERSHELL:
1. powershell -ExecutionPolicy Bypass -File .\01_PREPARE_BACKEND_WINDOWS.ps1
2. Execute RUN_THIS_IN_MYSQL_WORKBENCH.sql in MySQL Workbench.
3. powershell -ExecutionPolicy Bypass -File .\02_VALIDATE_BACKEND_WINDOWS.ps1
4. powershell -ExecutionPolicy Bypass -File .\03_START_BACKEND_WINDOWS.ps1

Expected:
BACKEND + MYSQL VALIDATION: PASS

Backend URL:
http://127.0.0.1:4173
