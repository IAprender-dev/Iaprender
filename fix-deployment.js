#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔧 Fixing deployment structure...');

// Check if we need to run the build first
if (!fs.existsSync('dist')) {
  console.log('📦 Running build process...');
  try {
    // Build with optimizations to speed up the process
    execSync('npm run build', { 
      stdio: 'inherit',
      timeout: 600000, // 10 minutes timeout
      env: { ...process.env, NODE_ENV: 'production' }
    });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Check if dist/public exists and needs to be moved
const publicDir = path.join(process.cwd(), 'dist', 'public');
const distDir = path.join(process.cwd(), 'dist');

if (fs.existsSync(publicDir)) {
  console.log('📁 Moving files from dist/public to dist...');
  
  try {
    // Get all items in dist/public
    const items = fs.readdirSync(publicDir);
    
    for (const item of items) {
      const srcPath = path.join(publicDir, item);
      const destPath = path.join(distDir, item);
      
      // Skip if destination already exists (don't overwrite server files)
      if (fs.existsSync(destPath)) {
        console.log(`⏭️  Skipping ${item} - already exists`);
        continue;
      }
      
      // Move the item
      fs.renameSync(srcPath, destPath);
      console.log(`✅ Moved ${item}`);
    }
    
    // Remove the now-empty public directory
    try {
      fs.rmdirSync(publicDir);
      console.log('🗑️  Removed empty dist/public directory');
    } catch (err) {
      console.log('⚠️  Could not remove dist/public directory (may not be empty)');
    }
    
    console.log('🎉 Deployment structure fixed successfully!');
    console.log('📋 Files are now properly organized in dist/ for deployment');
    
    // Verify the fix
    const indexExists = fs.existsSync(path.join(distDir, 'index.html'));
    const serverExists = fs.existsSync(path.join(distDir, 'index.js'));
    
    console.log('\n📊 Verification:');
    console.log(`   index.html in dist/: ${indexExists ? '✅' : '❌'}`);
    console.log(`   server files in dist/: ${serverExists ? '✅' : '❌'}`);
    
    if (indexExists) {
      console.log('\n🚀 Ready for deployment! The app should now deploy successfully.');
    } else {
      console.log('\n⚠️  index.html not found in dist/ - there may be an issue with the build.');
    }
    
  } catch (error) {
    console.error('❌ Error during file relocation:', error.message);
    process.exit(1);
  }
} else {
  console.log('ℹ️  No dist/public directory found - checking current structure...');
  
  const indexExists = fs.existsSync(path.join(distDir, 'index.html'));
  if (indexExists) {
    console.log('✅ Files are already in the correct location for deployment');
  } else {
    console.log('❌ Build may not have completed successfully - index.html not found');
  }
}