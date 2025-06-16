#!/bin/bash

echo "Starting deployment fix process..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if dist directory exists from previous build
if [ -d "dist" ]; then
    echo "Found existing dist directory, checking structure..."
    
    # Check if we have the problematic dist/public structure
    if [ -d "dist/public" ]; then
        echo "Found dist/public structure - applying fix..."
        
        # Move files from dist/public to dist root
        if [ "$(ls -A dist/public 2>/dev/null)" ]; then
            echo "Moving files from dist/public to dist..."
            
            # Use find to handle all files and subdirectories
            find dist/public -mindepth 1 -maxdepth 1 -exec mv {} dist/ \;
            
            # Remove the now-empty public directory
            rmdir dist/public 2>/dev/null
            echo "Removed empty dist/public directory"
        else
            echo "dist/public is empty, removing it..."
            rmdir dist/public 2>/dev/null
        fi
    fi
    
    # Verify the structure
    if [ -f "dist/index.html" ]; then
        echo "✓ index.html found in dist/ - deployment structure is correct"
    else
        echo "✗ index.html not found in dist/ - build may be incomplete"
    fi
    
    if [ -f "dist/index.js" ]; then
        echo "✓ Server files found in dist/"
    else
        echo "✗ Server files not found in dist/"
    fi
    
else
    echo "No dist directory found. Please run 'npm run build' first."
    exit 1
fi

echo "Deployment fix completed!"
echo ""
echo "Summary:"
echo "- Frontend files are now in dist/ root directory"
echo "- Backend files remain in dist/ as expected"
echo "- The deployment should now work correctly"
echo ""
echo "You can now deploy your application using Replit's deployment feature."