#!/bin/bash
set -e

echo "=== Starting deployment build ==="

echo "=== Step 1: Building frontend ==="
cd frontend
npm install
npm run build:prod
cd ..

echo "=== Step 2: Copying frontend to wwwroot ==="
mkdir -p backend/MillenniumERP.API/wwwroot
cp -r frontend/dist/* backend/MillenniumERP.API/wwwroot/

echo "=== Step 3: Publishing .NET backend ==="
dotnet publish backend/MillenniumERP.API/MillenniumERP.API.csproj -c Release -o backend/MillenniumERP.API/out

echo "=== Step 4: Copying dynamics365_integration scripts ==="
mkdir -p backend/MillenniumERP.API/out/dynamics365_integration
cp -r dynamics365_integration/*.py backend/MillenniumERP.API/out/dynamics365_integration/

echo "=== Step 5: Installing Python dependencies for sync ==="
pip install requests msal psycopg2-binary python-dotenv 2>/dev/null || echo "Python dependencies may already be installed"

echo "=== Build complete ==="
ls -la backend/MillenniumERP.API/out/wwwroot/
ls -la backend/MillenniumERP.API/out/dynamics365_integration/
