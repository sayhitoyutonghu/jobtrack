#!/bin/bash
# Docker Quick Start Script for Linux/Mac

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "============================================================"
echo "  JobTrack - Docker Quick Start"
echo "============================================================"
echo -e "${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not installed${NC}"
    echo ""
    echo "Please install Docker from:"
    echo "https://docs.docker.com/get-docker/"
    echo ""
    exit 1
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not running${NC}"
    echo ""
    echo "Please start Docker and try again"
    echo ""
    exit 1
fi

echo -e "${GREEN}[OK] Docker is ready${NC}"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}[ERROR] docker-compose.yml not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "Starting JobTrack services with Docker Compose..."
echo ""

# Build and start services
docker compose up -d --build

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR] Failed to start services${NC}"
    echo ""
    echo "Check the logs with: docker compose logs"
    exit 1
fi

echo ""
echo -e "${CYAN}"
echo "============================================================"
echo "  Services Started Successfully!"
echo "============================================================"
echo -e "${NC}"
echo ""
echo -e "  Frontend:    ${GREEN}http://localhost${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:3000${NC}"
echo -e "  Python ML:   ${GREEN}http://localhost:5000${NC}"
echo ""
echo "Wait 10-20 seconds for services to fully start, then:"
echo "  1. Open http://localhost in your browser"
echo "  2. Login with Gmail"
echo "  3. Start using JobTrack!"
echo ""
echo "Useful commands:"
echo "  View logs:    docker compose logs -f"
echo "  Stop:         docker compose down"
echo "  Restart:      docker compose restart"
echo ""

# Ask if user wants to view logs
read -p "View service logs now? (y/n): " SHOW_LOGS
if [ "$SHOW_LOGS" = "y" ] || [ "$SHOW_LOGS" = "Y" ]; then
    echo ""
    echo "Press Ctrl+C to exit log view"
    sleep 2
    docker compose logs -f
fi

