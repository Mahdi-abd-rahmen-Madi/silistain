const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Make sure the public directory exists
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Path to your source image (using logo.svg as the source)
const sourceImage = path.join(publicDir, 'logo.svg');

// Icon configurations
const icons = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'social-preview.jpg', size: 1200, height: 630, format: 'jpeg' },
];

// Generate each icon
async function generateIcons() {
  try {
    for (const icon of icons) {
      const outputPath = path.join(publicDir, icon.name);
      const image = sharp(sourceImage);
      
      // Resize with different options for JPEG vs PNG
      if (icon.format === 'jpeg') {
        await image
          .resize(icon.size, icon.height, {
            fit: 'cover',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .jpeg({ quality: 90 })
          .toFile(outputPath);
      } else {
        await image
          .resize(icon.size, icon.size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toFile(outputPath);
      }
      
      console.log(`Generated ${icon.name} (${icon.size}x${icon.height || icon.size})`);
    }
    
    console.log('\nAll icons generated successfully in the public/ directory');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the generator
generateIcons();
