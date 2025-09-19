#!/bin/bash

echo "Setting up Tattoo Directory test data..."
echo

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js and try again"
    exit 1
fi

# Change to script directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

# Run the setup script
echo "Running test data setup..."
node setup-test-data.js

if [ $? -ne 0 ]; then
    echo "Error: Setup failed"
    exit 1
else
    echo
    echo "Setup completed successfully!"
    echo "Test data is ready for use with the data seeder."
fi