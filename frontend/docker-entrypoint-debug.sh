#!/bin/sh

# Docker entrypoint script for Next.js with debugging support

set -e

# Check if debugging is enabled
if [ "${ENABLE_DEBUG}" = "true" ]; then
    echo "Debug mode enabled for frontend - starting with inspector on port 9230"
    # Start Next.js with Node.js inspector for debugging
    exec node --inspect=0.0.0.0:9230 ./node_modules/.bin/next dev -H 0.0.0.0
else
    # Normal development mode
    exec "$@"
fi