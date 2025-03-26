#!/bin/bash
# Stop the SoLBot backend server gracefully

# Check if the PID file exists
if [ -f backend.pid ]; then
    PID=$(cat backend.pid)
    
    # Check if the process is still running
    if ps -p $PID > /dev/null; then
        echo "Stopping SoLBot backend server (PID: $PID)..."
        kill $PID
        
        # Wait for a moment and check if it's still running
        sleep 2
        if ps -p $PID > /dev/null; then
            echo "Process is still running, forcing termination..."
            kill -9 $PID
        fi
        
        echo "SoLBot backend server stopped"
    else
        echo "SoLBot backend server is not running (stale PID file)"
    fi
    
    # Remove the PID file
    rm backend.pid
else
    # Try to find and kill any running backend processes
    PIDS=$(lsof -ti:8080)
    if [ -n "$PIDS" ]; then
        echo "Found server processes on port 8080: $PIDS"
        echo "Stopping all server processes..."
        kill $PIDS 2>/dev/null || kill -9 $PIDS 2>/dev/null
        echo "SoLBot backend server stopped"
    else
        echo "No running SoLBot backend server found"
    fi
fi 