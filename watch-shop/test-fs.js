const fs = require('fs');
const path = require('path');

function listFiles(dir) {
  const files = [];
  
  function traverse(current) {
    const items = fs.readdirSync(current, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(current, item.name);
      
      if (item.isDirectory()) {
        traverse(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

console.log('Current directory:', __dirname);
console.log('Listing dist directory:');
try {
  const files = listFiles(path.join(__dirname, 'dist'));
  console.log(files);
} catch (error) {
  console.error('Error reading dist directory:', error);
}
