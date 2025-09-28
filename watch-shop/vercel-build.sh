#!/bin/bash
set -e

# Install dependencies
echo "Installing dependencies..."
npm ci --prefer-offline

# Build the project
echo "Building project..."
NODE_ENV=production npm run build

echo "Build completed successfully!"

# Create a .vercel directory if it doesn't exist
mkdir -p .vercel

# Create a basic output configuration
echo '{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    },
    {
      "src": "api/upload.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "^/assets/(.*)", "dest": "/assets/$1" },
    { "src": "^/favicon.ico$", "dest": "/favicon.ico" },
    { "src": "^/upload-test.html$", "dest": "/upload-test.html" },
    { "src": "^(?!/api).*", "dest": "/index.html" }
  ]
}' > .vercel/project.json

echo '{
  "org": "mahdi-abd-rahmen-madis-projects",
  "project": "watch-shop"
}' > .vercel/project.json.tmp

echo '{
  "projectId": "YOUR_PROJECT_ID"
}' > .vercel/.project-settings.json

echo '{
  "projectId": "YOUR_PROJECT_ID",
  "orgId": "YOUR_ORG_ID"
}' > .vercel/.git/vercel/project.json
