#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm ci --prefer-offline

echo "🚀 Building project..."
npm run build

echo "✅ Build completed successfully!"
