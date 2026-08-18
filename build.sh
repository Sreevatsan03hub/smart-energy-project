#!/usr/bin/env bash
# exit on error
set -o errexit

echo "==> 1. Building React Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "==> 2. Installing Python Backend Dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> 3. Build Finished Successfully!"
