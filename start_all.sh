#!/bin/bash
# Start both the backend and frontend servers

# Change to the project directory
cd "$(dirname "$0")"

# Clear the terminal
clear

echo "==== Starting SoLBot Application ===="
echo

# First check if servers are already running
BACKEND_RUNNING=$(lsof -ti:8080)
FRONTEND_RUNNING=$(lsof -ti:3000)

if [ -n "$BACKEND_RUNNING" ]; then
    echo "Backend server is already running on port 8080"
else
    # Start the backend server
    echo "Starting backend server..."
    ./start_backend.sh
    sleep 2
fi

if [ -n "$FRONTEND_RUNNING" ]; then
    echo "Frontend server is already running on port 3000"
else
    # Start the frontend server
    echo "Starting frontend server..."
    echo "Frontend logs will appear below (press Ctrl+C to stop):"
    echo "-----------------------------------------------------"
    
    # Activate the virtual environment for npm to work properly
    source .venv/bin/activate
    
    # Run Next.js frontend
    npm run dev -- -p 3000
fi 