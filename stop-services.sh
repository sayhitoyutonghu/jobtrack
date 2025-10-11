#!/bin/bash
# Stop all JobTrack services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping JobTrack services...${NC}\n"

# Stop backend
if [ -f "backend.pid" ]; then
    PID=$(cat backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo -e "${GREEN}✓ Backend stopped (PID: $PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Backend process not found${NC}"
    fi
    rm backend.pid
fi

# Stop frontend
if [ -f "frontend.pid" ]; then
    PID=$(cat frontend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo -e "${GREEN}✓ Frontend stopped (PID: $PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend process not found${NC}"
    fi
    rm frontend.pid
fi

# Kill any remaining node processes on ports 3000 and 5173
if command -v lsof &> /dev/null; then
    PORT_3000=$(lsof -ti:3000)
    PORT_5173=$(lsof -ti:5173)
    
    if [ ! -z "$PORT_3000" ]; then
        kill $PORT_3000 2>/dev/null
        echo -e "${GREEN}✓ Process on port 3000 stopped${NC}"
    fi
    
    if [ ! -z "$PORT_5173" ]; then
        kill $PORT_5173 2>/dev/null
        echo -e "${GREEN}✓ Process on port 5173 stopped${NC}"
    fi
fi

echo -e "\n${GREEN}All services stopped!${NC}"

