#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export DOTNET_CLI_HOME="${DOTNET_CLI_HOME:-/private/tmp/timberflow-dotnet}"
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export DOTNET_ROOT="${DOTNET_ROOT:-/opt/homebrew/opt/dotnet@8/libexec}"
export PATH="/opt/homebrew/opt/dotnet@8/bin:$PATH"
DOTNET_BIN="${DOTNET_BIN:-/opt/homebrew/opt/dotnet@8/bin/dotnet}"

export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-timbertracker}"
export PGPASSWORD="${PGPASSWORD:-timbertracker}"
export PGDATABASE="${PGDATABASE:-timberflow_dev}"
export ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Development}"

command="${1:-seed}"

case "$command" in
  seed)
    "$DOTNET_BIN" build backend/DbSetup/DbSetup.csproj -m:1 -p:UseSharedCompilation=false -v:minimal
    "$DOTNET_BIN" backend/DbSetup/bin/Debug/net8.0/DbSetup.dll seed-job-time-test-data
    ;;
  remove)
    "$DOTNET_BIN" build backend/DbSetup/DbSetup.csproj -m:1 -p:UseSharedCompilation=false -v:minimal
    "$DOTNET_BIN" backend/DbSetup/bin/Debug/net8.0/DbSetup.dll remove-job-time-test-data
    ;;
  *)
    echo "Usage: $0 [seed|remove]" >&2
    exit 2
    ;;
esac
