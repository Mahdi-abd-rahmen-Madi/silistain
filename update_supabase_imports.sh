#!/bin/bash

# Update imports in all TypeScript/JavaScript files
find /home/mahdi/dev/silistain/watch-shop/src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -exec sed -i 's|from ["'"'`].*utils/supabaseClient["'"'`]|from "../lib/supabaseClient"|g' {} \;

echo "Supabase imports updated successfully!"
