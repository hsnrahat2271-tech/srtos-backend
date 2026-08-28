#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if command -v cygpath >/dev/null 2>&1; then
  PS="$(cygpath -w "$HERE/03_START_BACKEND_WINDOWS.ps1")"
else
  PS="$HERE/03_START_BACKEND_WINDOWS.ps1"
fi
echo "Starting SRTOS QLD A3 backend..."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS"
