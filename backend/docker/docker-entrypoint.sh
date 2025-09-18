#!/bin/sh

# Docker entrypoint script for Lambda Runtime Interface Emulator
# Switches between local development and production runtime

set -e

# Check if we're running in AWS Lambda environment
if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
    echo "Running in local development mode with Lambda RIE"
    
    # Check if debugging is enabled
    if [ "${ENABLE_DEBUG}" = "true" ]; then
        echo "Debug mode enabled - starting with inspector on port 9229"
        # Start with Node.js inspector for debugging
        exec /usr/bin/aws-lambda-rie node --inspect=0.0.0.0:9229 /usr/local/bin/aws-lambda-ric $1
    else
        # Local development - use Lambda Runtime Interface Emulator
        exec /usr/bin/aws-lambda-rie /var/lang/bin/node /var/runtime/index.mjs $1
    fi
else
    echo "Running in AWS Lambda production environment"
    # Production - use standard Lambda runtime
    exec /var/lang/bin/node /var/runtime/index.mjs $1
fi