#!/bin/bash

# Fix Railway CD command error
echo "🔧 Fixing Railway CD command error"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Please run this script from the JobTrack root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Add all changes to git
echo "📦 Adding changes to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Fix Railway deployment: Remove CD command from startCommand

- Remove 'cd backend &&' from startCommand
- Use direct path 'node backend/server.js'
- Fix 'The executable cd could not be found' error
- Simplify deployment configuration"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Railway CD error fix applied!"
echo ""
echo "Changes made:"
echo "- Removed 'cd' command from startCommand"
echo "- Updated railway.json to use 'node backend/server.js'"
echo "- Updated nixpacks.toml to use 'node backend/server.js'"
echo ""
echo "Next steps:"
echo "1. Go to your Railway dashboard"
echo "2. The deployment should automatically retry"
echo "3. If not, manually trigger a new deployment"
echo "4. Monitor the build logs for success"
echo ""
echo "If you still see issues, try:"
echo "- Switch to Docker builder using railway-docker.json"
echo "- Check Railway service status: https://status.railway.app"
