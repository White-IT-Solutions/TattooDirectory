#!/bin/bash

echo "========================================"
echo "Final Validation - Data Seeder System"
echo "========================================"
echo

cd "$(dirname "$0")/data-seeder"

echo "Starting comprehensive validation..."
echo

npm run validate:complete

echo
echo "Validation complete!"