#!/bin/bash
# Stop both frontend and backend servers

# Clear terminal
clear
echo "==== Stopping SoLBot Application ===="
echo

# Stop frontend server
FRONTEND_PIDS=$(lsof -ti:3000)
if [ -n "$FRONTEND_PIDS" ]; then
    echo "Stopping frontend server..."
    kill $FRONTEND_PIDS 2>/dev/null || kill -9 $FRONTEND_PIDS 2>/dev/null
    echo "Frontend server stopped"
else
    echo "No frontend server found running on port 3000"
fi

# Stop backend server using the dedicated script
echo "Stopping backend server..."
./stop_backend.sh

echo
echo "All servers stopped successfully" 