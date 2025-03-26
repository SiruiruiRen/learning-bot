#!/bin/bash
# SoLBot Management Script
# This script helps to manage SoLBot's backend processes

# Colors for status output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check if SoLBot is running
check_status() {
    pids=$(pgrep -f "python run_backend.py")
    if [ -z "$pids" ]; then
        echo -e "${RED}SoLBot is not running${NC}"
        return 1
    else
        echo -e "${GREEN}SoLBot is running with PIDs:${NC} $pids"
        echo -e "Log file: ${YELLOW}backend.log${NC}"
        return 0
    fi
}

# Function to start SoLBot
start_solbot() {
    # Check if already running
    if check_status > /dev/null; then
        echo -e "${YELLOW}SoLBot is already running. Stop it first if you want to restart.${NC}"
        check_status
        return 0
    fi
    
    # Activate virtual environment if it exists
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    fi
    
    # Start the backend with improved performance
    echo -e "${GREEN}Starting SoLBot backend...${NC}"
    python run_backend.py > backend.log 2>&1 &
    
    # Wait a moment and check status
    sleep 2
    check_status
    
    echo -e "${YELLOW}To view logs in real-time, use: ${NC}tail -f backend.log"
}

# Function to stop SoLBot
stop_solbot() {
    pids=$(pgrep -f "python run_backend.py")
    if [ -z "$pids" ]; then
        echo -e "${YELLOW}SoLBot is not running${NC}"
    else
        echo -e "${RED}Stopping SoLBot processes: ${NC}$pids"
        kill $pids
        sleep 2
        
        # Check if any processes are still running
        pids=$(pgrep -f "python run_backend.py")
        if [ -z "$pids" ]; then
            echo -e "${GREEN}SoLBot stopped successfully${NC}"
        else
            echo -e "${RED}Some SoLBot processes are still running. Force killing: ${NC}$pids"
            kill -9 $pids
            echo -e "${GREEN}SoLBot stopped forcefully${NC}"
        fi
    fi
}

# Function to view recent logs
view_logs() {
    if [ -f "backend.log" ]; then
        echo -e "${YELLOW}Showing last 20 lines of logs:${NC}"
        tail -n 20 backend.log
        echo -e "\n${YELLOW}To view logs in real-time, use: ${NC}tail -f backend.log"
    else
        echo -e "${RED}Log file not found${NC}"
    fi
}

# Help function
show_help() {
    echo -e "${YELLOW}SoLBot Management Script${NC}"
    echo -e "Usage: ./start_solbot.sh [command]"
    echo -e "\nCommands:"
    echo -e "  ${GREEN}start${NC}    Start SoLBot backend"
    echo -e "  ${RED}stop${NC}     Stop SoLBot backend"
    echo -e "  ${YELLOW}status${NC}   Check SoLBot status"
    echo -e "  ${YELLOW}logs${NC}     View recent logs"
    echo -e "  ${YELLOW}help${NC}     Show this help message"
}

# Process command line arguments
case "$1" in
    start)
        start_solbot
        ;;
    stop)
        stop_solbot
        ;;
    status)
        check_status
        ;;
    logs)
        view_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        # No arguments, show help and status
        show_help
        echo -e "\n${YELLOW}Current Status:${NC}"
        check_status
        ;;
esac

exit 0
