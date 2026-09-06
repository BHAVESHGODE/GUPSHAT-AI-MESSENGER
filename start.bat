@echo off
echo Starting GuppShup Chat Application...

if not exist "backend\.env" (
    echo Warning: backend\.env file not found. Please create it with your environment variables.
)

echo Starting backend and frontend servers...
npm run dev