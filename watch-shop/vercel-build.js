const { execSync } = require('child_process');

// Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Build the project
console.log('Building project...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Build completed successfully!');
