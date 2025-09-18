#!/bin/sh

# Docker entrypoint script for Next.js with debugging support

set -e

# Ensure .next directory exists and has correct permissions
if [ ! -d "/app/frontend/.next" ]; then
    echo "Creating .next directory..."
    mkdir -p /app/frontend/.next
fi

# Fix permissions for .next directory (in case of volume mount issues)
if [ -w "/app/frontend/.next" ]; then
    echo ".next directory is writable"
else
    echo "Warning: .next directory is not writable - this may cause build issues"
fi

# Change to root directory for npm workspace commands
cd /app

echo "Starting frontend container from workspace root..."
echo "Current directory: $(pwd)"

# Check if debugging is enabled
if [ "${ENABLE_DEBUG}" = "true" ]; then
    echo "Debug mode enabled for frontend - starting with inspector on port 9230"
    # Start Next.js with Node.js inspector for debugging
    exec node --inspect=0.0.0.0:9230 node_modules/.bin/next dev -H 0.0.0.0 --port 3000
else
    # Normal development mode - run from workspace root
    echo "Starting Next.js development server via npm workspace..."
    exec "$@"
fi