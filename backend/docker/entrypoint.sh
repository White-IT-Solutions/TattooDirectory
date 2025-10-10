#!/bin/sh
set -e
echo "Starting Lambda Runtime Interface Emulator"

# Check if running inside Lambda environment
if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
    echo "Running with Lambda Runtime Interface Emulator"
    exec /usr/bin/aws-lambda-rie /var/lang/bin/node --experimental-modules --es-module-specifier-resolution=node ${LAMBDA_TASK_ROOT}/$1
else
    echo "Running in AWS Lambda environment"
    exec /var/lang/bin/node --experimental-modules --es-module-specifier-resolution=node ${LAMBDA_TASK_ROOT}/$1
fi