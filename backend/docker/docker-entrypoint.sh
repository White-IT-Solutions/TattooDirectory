#!/bin/sh
set -e
if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
    echo "Running in local development mode with Lambda RIE"
    if [ "${ENABLE_DEBUG}" = "true" ]; then
        echo "Debug mode enabled - starting with inspector on port 9229"
        exec /usr/bin/aws-lambda-rie node --inspect=0.0.0.0:9229 /usr/local/bin/aws-lambda-ric $1
    else
        exec /usr/bin/aws-lambda-rie /var/lang/bin/node /var/runtime/index.mjs $1
    fi
else
    echo "Running in AWS Lambda production environment"
    exec /var/lang/bin/node /var/runtime/index.mjs $1
fi