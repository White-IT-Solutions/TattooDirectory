#!/bin/sh
set -e
echo "Starting Lambda Runtime Interface Emulator"
exec /usr/bin/aws-lambda-rie /var/lang/bin/node /var/runtime/index.mjs $1