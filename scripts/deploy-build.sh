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

echo "=== Build complete ==="
ls -la backend/MillenniumERP.API/out/wwwroot/
