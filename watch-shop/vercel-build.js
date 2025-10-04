const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set environment to production
process.env.NODE_ENV = 'production';

// Ensure .env file exists
const envExamplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('Copying .env.example to .env...');
  fs.copyFileSync(envExamplePath, envPath);
}

// Install dependencies
console.log('\n🔧 Installing dependencies...');
try {
  execSync('npm ci --prefer-offline', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('✅ Dependencies installed successfully!');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error);
  process.exit(1);
}

// Build the project
console.log('\n🏗️  Building project...');
try {
  // Load environment variables from .env file if it exists
  const envConfig = {};
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/['"]/g, '');
        // Only include VITE_ prefixed variables and required ones
        if (key.startsWith('VITE_') || ['NODE_ENV', 'VERCEL', 'CI'].includes(key)) {
          envConfig[key] = value;
        }
      }
    });
  }

  // Merge with process.env and ensure required variables are set
  const buildEnv = {
    ...process.env,
    ...envConfig,
    NODE_ENV: 'production',
    VERCEL: '1',
    VITE_VERCEL: 'true',
    CI: '1'
  };

  console.log('Building with environment variables:', Object.keys(buildEnv).filter(k => k.startsWith('VITE_')));

  execSync('vite build --mode production', { 
    stdio: 'inherit',
    env: buildEnv
  });
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, '.vercel', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create config.json for Vercel
  const config = {
    version: 3,
    framework: 'vite',
    buildCommand: 'vite build',
    installCommand: 'npm ci',
    outputDirectory: 'dist',
    framework: {
      version: '4.0.0'
    }
  };
  
  fs.writeFileSync(path.join(outputDir, 'config.json'), JSON.stringify(config, null, 2));
  
  console.log('🚀 Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
