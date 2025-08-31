// This script will update all imports from '../utils/supabaseClient' to '../lib/supabaseClient'
import * as fs from 'fs';
import * as path from 'path';

const srcDir = path.join(__dirname, 'watch-shop', 'src');

const fileTypes = ['.ts', '.tsx', '.js', '.jsx'];

function updateFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updatedContent = content.replace(
    /from ['"]\.\.\/utils\/supabaseClient['"]/g,
    "from '../lib/supabaseClient'"
  );
  
  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function processDirectory(directory: string) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fileTypes.includes(path.extname(file).toLowerCase())) {
      updateFile(fullPath);
    }
  }
}

console.log('Updating Supabase imports...');
processDirectory(srcDir);
console.log('Import updates complete!');
