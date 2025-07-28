import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(__dirname, '..', 'app');

async function findFiles(dir, extensions) {
  const files = [];
  
  async function scan(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function updateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;

    // Client-side replacements
    if (content.includes('@supabase/auth-helpers-nextjs') && content.includes('createClientComponentClient')) {
      content = content.replace(
        /import\s*{\s*createClientComponentClient\s*}\s*from\s*["']@supabase\/auth-helpers-nextjs["']/g,
        'import { createClient } from "@/lib/supabase/client"'
      );
      content = content.replace(
        /createClientComponentClient\(\)/g,
        'createClient()'
      );
      modified = true;
    }

    // Server-side replacements
    if (content.includes('@supabase/auth-helpers-nextjs') && content.includes('createServerComponentClient')) {
      content = content.replace(
        /import\s*{\s*createServerComponentClient\s*}\s*from\s*["']@supabase\/auth-helpers-nextjs["']/g,
        'import { createClient } from "@/lib/supabase/server"'
      );
      content = content.replace(
        /createServerComponentClient\(\{\s*cookies\s*\}\)/g,
        'await createClient()'
      );
      modified = true;
    }

    // Route handler replacements
    if (content.includes('@supabase/auth-helpers-nextjs') && content.includes('createRouteHandlerClient')) {
      content = content.replace(
        /import\s*{\s*createRouteHandlerClient\s*}\s*from\s*["']@supabase\/auth-helpers-nextjs["']/g,
        'import { createClient } from "@/lib/supabase/server"'
      );
      content = content.replace(
        /createRouteHandlerClient\(\{\s*cookies\s*\}\)/g,
        'await createClient()'
      );
      modified = true;
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Updated ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${path.relative(process.cwd(), filePath)}:`, error);
  }
}

async function main() {
  try {
    console.log('🔍 Finding TypeScript/JavaScript files...');
    const files = await findFiles(APP_DIR, ['.ts', '.tsx', '.js', '.jsx']);
    
    console.log(`📝 Found ${files.length} files to process`);
    
    for (const file of files) {
      await updateFile(file);
    }
    
    console.log('✨ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main(); 