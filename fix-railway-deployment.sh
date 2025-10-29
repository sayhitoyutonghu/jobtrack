#!/bin/bash

# Fix Railway Deployment Script
echo "🔧 Fixing Railway Deployment for JobTrack"
echo "=========================================="

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
git commit -m "Fix Railway deployment configuration

- Switch from Docker to Nixpacks builder
- Simplify build process
- Fix 503 Service Unavailable error
- Optimize for Railway platform"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment fix applied!"
echo ""
echo "Next steps:"
echo "1. Go to your Railway dashboard"
echo "2. The deployment should automatically retry"
echo "3. If not, manually trigger a new deployment"
echo "4. Monitor the build logs for any issues"
echo ""
echo "If you still see issues:"
echo "- Check Railway service status: https://status.railway.app"
echo "- Try switching to a different region"
echo "- Contact Railway support if the problem persists"
