#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const buildSteps = [
  {
    name: 'Frontend Build',
    command: 'npx',
    args: ['vite', 'build', '--mode', 'production'],
    timeout: 300000 // 5 minutes
  },
  {
    name: 'Backend Build', 
    command: 'npx',
    args: ['esbuild', 'server/index.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outdir=dist'],
    timeout: 60000 // 1 minute
  }
];

async function runBuildStep(step) {
  return new Promise((resolve, reject) => {
    console.log(`Starting ${step.name}...`);
    
    const child = spawn(step.command, step.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`${step.name} timed out after ${step.timeout}ms`));
    }, step.timeout);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        console.log(`${step.name} completed successfully`);
        resolve();
      } else {
        console.error(`${step.name} failed with code ${code}`);
        console.error('Error output:', stderr);
        reject(new Error(`${step.name} failed`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function fixDeploymentStructure() {
  const publicDir = path.join(process.cwd(), 'dist', 'public');
  const distDir = path.join(process.cwd(), 'dist');

  if (fs.existsSync(publicDir)) {
    console.log('Fixing deployment structure...');
    
    const items = fs.readdirSync(publicDir);
    
    for (const item of items) {
      const srcPath = path.join(publicDir, item);
      const destPath = path.join(distDir, item);
      
      if (!fs.existsSync(destPath)) {
        fs.renameSync(srcPath, destPath);
        console.log(`Moved ${item} to dist/`);
      }
    }
    
    // Remove empty public directory
    try {
      fs.rmdirSync(publicDir);
      console.log('Removed empty dist/public directory');
    } catch (err) {
      console.log('Could not remove dist/public directory');
    }
  }
}

async function main() {
  try {
    console.log('Building application for deployment...');
    
    // Run build steps sequentially
    for (const step of buildSteps) {
      await runBuildStep(step);
    }
    
    // Fix deployment structure
    fixDeploymentStructure();
    
    // Verify deployment readiness
    const indexExists = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
    const serverExists = fs.existsSync(path.join(process.cwd(), 'dist', 'index.js'));
    
    console.log('\nDeployment Verification:');
    console.log(`Frontend files: ${indexExists ? 'Ready' : 'Missing'}`);
    console.log(`Backend files: ${serverExists ? 'Ready' : 'Missing'}`);
    
    if (indexExists && serverExists) {
      console.log('\nApplication is ready for deployment!');
      console.log('You can now deploy using Replit\'s deployment feature.');
    } else {
      console.log('\nSome files are missing. Please check the build output.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

main();