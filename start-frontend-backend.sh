#!/bin/bash
# Quick start script for JobTrack Frontend and Backend (Linux/Mac)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${CYAN}============================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}============================================================${NC}\n"
}

print_step() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)] ✓ $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date +%H:%M:%S)] ✗ $1${NC}"
}

print_header "JobTrack - Starting Frontend and Backend"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if backend dependencies are installed
print_step "[1/4] Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    print_step "Installing backend dependencies..."
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    print_success "Backend dependencies installed"
    cd ..
else
    print_success "Backend dependencies OK"
fi

# Check if frontend dependencies are installed
print_step "[2/4] Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    print_step "Installing frontend dependencies..."
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    print_success "Frontend dependencies installed"
    cd ..
else
    print_success "Frontend dependencies OK"
fi

echo ""
print_step "[3/4] Starting Backend Server (Port 3000)..."

# Start backend in background
cd backend
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="JobTrack Backend" -- bash -c "npm run dev; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -T "JobTrack Backend" -e "npm run dev" &
else
    # Fallback to background process
    npm run dev > ../backend.log 2>&1 &
    echo $! > ../backend.pid
fi
cd ..
sleep 3
print_success "Backend server starting..."

print_step "[4/4] Starting Frontend Server (Port 5173)..."

# Start frontend in background
cd frontend
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="JobTrack Frontend" -- bash -c "npm run dev; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -T "JobTrack Frontend" -e "npm run dev" &
else
    # Fallback to background process
    npm run dev > ../frontend.log 2>&1 &
    echo $! > ../frontend.pid
fi
cd ..
sleep 2
print_success "Frontend server starting..."

echo ""
print_header "Services Started Successfully!"

echo -e "  Frontend:    ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:3000${NC}"
echo -e "  Health:      ${GREEN}http://localhost:3000/health${NC}"

echo ""
echo -e "${YELLOW}⏳ Wait 5-10 seconds for services to fully start, then:${NC}"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Login with Gmail"
echo "   3. Start using JobTrack!"

echo ""
echo -e "${YELLOW}🛑 To stop services:${NC}"
if [ -f "backend.pid" ] && [ -f "frontend.pid" ]; then
    echo "   Run: ./stop-services.sh"
    echo "   Or manually: kill \$(cat backend.pid frontend.pid)"
else
    echo "   Close the terminal windows running the services"
fi

echo ""

