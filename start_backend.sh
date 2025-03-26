#!/bin/bash
# Start the SoLBot backend server in the background
# This script ensures proper environment activation and error logging

# Kill any existing backend processes
echo "Checking for existing backend processes..."
pkill -f "python -m uvicorn"

# Navigate to the backend directory to run the server
cd backend

# Start the backend server from within the backend directory
echo "Starting backend server..."
export PYTHONPATH=$PYTHONPATH:$(pwd)/..
python -m uvicorn main:app --reload --port 8080

# Keep this process running
echo "Backend server started on port 8080"
