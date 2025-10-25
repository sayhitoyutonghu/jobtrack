#!/bin/bash

# JobTrack Railway Deployment Script
# This script helps prepare the project for Railway deployment

echo "🚀 JobTrack Railway Deployment Preparation"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Please run this script from the JobTrack root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit for Railway deployment"
fi

echo "✅ Git repository ready"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️  Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI ready"

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOF
# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.production

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF
fi

echo "✅ .gitignore configured"

# Check if all required files exist
echo "🔍 Checking required files..."

required_files=(
    "railway.json"
    "nixpacks.toml"
    "Procfile"
    "railway-start.js"
    "railway.env.example"
    "RAILWAY_DEPLOYMENT_GUIDE.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🎯 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Add Railway deployment configuration'"
echo "   git push origin main"
echo ""
echo "2. Create a new project on Railway:"
echo "   - Go to https://railway.app"
echo "   - Click 'New Project'"
echo "   - Select 'Deploy from GitHub repo'"
echo "   - Choose your JobTrack repository"
echo ""
echo "3. Configure environment variables:"
echo "   - Copy values from railway.env.example"
echo "   - Add your Google OAuth credentials"
echo "   - Set your Railway domain in GOOGLE_REDIRECT_URI"
echo ""
echo "4. Deploy and test:"
echo "   - Railway will automatically deploy"
echo "   - Check the deployment logs"
echo "   - Test your application"
echo ""
echo "📖 For detailed instructions, see RAILWAY_DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Ready for Railway deployment!"
