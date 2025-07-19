#!/bin/bash

echo "Starting build process..."

# Run vite build
echo "Building frontend..."
npx vite build --mode production

if [ $? -ne 0 ]; then
    echo "Frontend build failed"
    exit 1
fi

# Build backend
echo "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

if [ $? -ne 0 ]; then
    echo "Backend build failed"
    exit 1
fi

# Check if dist/public exists
if [ -d "dist/public" ]; then
    echo "Moving files from dist/public to dist..."
    
    # Move all files from dist/public to dist (avoid overwriting existing files)
    for item in dist/public/*; do
        if [ -e "$item" ]; then
            basename_item=$(basename "$item")
            if [ ! -e "dist/$basename_item" ]; then
                mv "$item" "dist/"
                echo "Moved $basename_item to dist/"
            else
                echo "Skipped $basename_item - already exists in dist/"
            fi
        fi
    done
    
    # Remove empty dist/public directory
    rmdir dist/public 2>/dev/null && echo "Removed empty dist/public directory"
else
    echo "No dist/public directory found"
fi

echo "Build process completed successfully!"
echo "Files are now properly organized for deployment in the dist/ directory"