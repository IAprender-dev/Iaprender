#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Paths
const publicDir = path.join(rootDir, 'dist', 'public');
const distDir = path.join(rootDir, 'dist');

console.log('Post-build: Moving files from dist/public to dist...');

// Check if dist/public exists
if (!fs.existsSync(publicDir)) {
  console.log('No dist/public directory found, skipping file move.');
  process.exit(0);
}

// Function to copy files recursively
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    for (const file of files) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  // Get all files and directories in dist/public
  const items = fs.readdirSync(publicDir);
  
  // Copy each item to dist root
  for (const item of items) {
    const srcPath = path.join(publicDir, item);
    const destPath = path.join(distDir, item);
    
    // Skip if destination already exists (don't overwrite server files)
    if (fs.existsSync(destPath)) {
      console.log(`Skipping ${item} - already exists in dist/`);
      continue;
    }
    
    copyRecursive(srcPath, destPath);
    console.log(`Moved ${item} to dist/`);
  }
  
  // Remove the now-empty dist/public directory
  fs.rmSync(publicDir, { recursive: true, force: true });
  console.log('Removed dist/public directory');
  
  console.log('Post-build: File relocation completed successfully!');
} catch (error) {
  console.error('Post-build error:', error);
  process.exit(1);
}