@echo off
REM JobTrack Railway Deployment Script for Windows
REM This script helps prepare the project for Railway deployment

echo 🚀 JobTrack Railway Deployment Preparation
echo ==========================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the JobTrack root directory
    pause
    exit /b 1
)

if not exist "backend\package.json" (
    echo ❌ Error: Backend package.json not found
    pause
    exit /b 1
)

echo ✅ Project structure verified

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit for Railway deployment"
)

echo ✅ Git repository ready

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Railway CLI not found. Installing...
    npm install -g @railway/cli
)

echo ✅ Railway CLI ready

REM Create .gitignore if it doesn't exist
if not exist ".gitignore" (
    echo 📝 Creating .gitignore...
    (
        echo # Dependencies
        echo node_modules/
        echo */node_modules/
        echo.
        echo # Environment variables
        echo .env
        echo .env.local
        echo .env.production
        echo.
        echo # Logs
        echo *.log
        echo npm-debug.log*
        echo yarn-debug.log*
        echo yarn-error.log*
        echo.
        echo # Runtime data
        echo pids
        echo *.pid
        echo *.seed
        echo *.pid.lock
        echo.
        echo # Coverage directory used by tools like istanbul
        echo coverage/
        echo.
        echo # nyc test coverage
        echo .nyc_output
        echo.
        echo # Dependency directories
        echo jspm_packages/
        echo.
        echo # Optional npm cache directory
        echo .npm
        echo.
        echo # Optional REPL history
        echo .node_repl_history
        echo.
        echo # Output of 'npm pack'
        echo *.tgz
        echo.
        echo # Yarn Integrity file
        echo .yarn-integrity
        echo.
        echo # dotenv environment variables file
        echo .env
        echo.
        echo # parcel-bundler cache
        echo .cache
        echo .parcel-cache
        echo.
        echo # next.js build output
        echo .next
        echo.
        echo # nuxt.js build output
        echo .nuxt
        echo.
        echo # vuepress build output
        echo .vuepress/dist
        echo.
        echo # Serverless directories
        echo .serverless
        echo.
        echo # FuseBox cache
        echo .fusebox/
        echo.
        echo # DynamoDB Local files
        echo .dynamodb/
        echo.
        echo # Python
        echo __pycache__/
        echo *.py[cod]
        echo *$py.class
        echo *.so
        echo .Python
        echo env/
        echo venv/
        echo ENV/
        echo env.bak/
        echo venv.bak/
        echo.
        echo # IDE
        echo .vscode/
        echo .idea/
        echo *.swp
        echo *.swo
        echo.
        echo # OS
        echo .DS_Store
        echo Thumbs.db
    ) > .gitignore
)

echo ✅ .gitignore configured

REM Check if all required files exist
echo 🔍 Checking required files...

if exist "railway.json" (
    echo ✅ railway.json exists
) else (
    echo ❌ railway.json missing
)

if exist "nixpacks.toml" (
    echo ✅ nixpacks.toml exists
) else (
    echo ❌ nixpacks.toml missing
)

if exist "Procfile" (
    echo ✅ Procfile exists
) else (
    echo ❌ Procfile missing
)

if exist "railway-start.js" (
    echo ✅ railway-start.js exists
) else (
    echo ❌ railway-start.js missing
)

if exist "railway.env.example" (
    echo ✅ railway.env.example exists
) else (
    echo ❌ railway.env.example missing
)

if exist "RAILWAY_DEPLOYMENT_GUIDE.md" (
    echo ✅ RAILWAY_DEPLOYMENT_GUIDE.md exists
) else (
    echo ❌ RAILWAY_DEPLOYMENT_GUIDE.md missing
)

echo.
echo 🎯 Next Steps:
echo 1. Push your code to GitHub:
echo    git add .
echo    git commit -m "Add Railway deployment configuration"
echo    git push origin main
echo.
echo 2. Create a new project on Railway:
echo    - Go to https://railway.app
echo    - Click "New Project"
echo    - Select "Deploy from GitHub repo"
echo    - Choose your JobTrack repository
echo.
echo 3. Configure environment variables:
echo    - Copy values from railway.env.example
echo    - Add your Google OAuth credentials
echo    - Set your Railway domain in GOOGLE_REDIRECT_URI
echo.
echo 4. Deploy and test:
echo    - Railway will automatically deploy
echo    - Check the deployment logs
echo    - Test your application
echo.
echo 📖 For detailed instructions, see RAILWAY_DEPLOYMENT_GUIDE.md
echo.
echo 🎉 Ready for Railway deployment!
echo.
pause
