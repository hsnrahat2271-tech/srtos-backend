#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if command -v cygpath >/dev/null 2>&1; then
  PS="$(cygpath -w "$HERE/02_VALIDATE_BACKEND_WINDOWS.ps1")"
else
  PS="$HERE/02_VALIDATE_BACKEND_WINDOWS.ps1"
fi
echo "Validating SRTOS QLD A3 backend + MySQL..."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS"
