#!/bin/bash

# Legacy Seed Script Wrapper (Linux/Unix)
# Maintains compatibility with existing Docker integration

echo "⚠️  DEPRECATION NOTICE: This script is deprecated"
echo "Please use: npm run setup-data"
echo "Running via compatibility layer..."
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to scripts directory
cd "$SCRIPT_DIR/.."

# Execute via backward compatibility layer
node backward-compatibility.js seed "$@"

# Check exit code
if [ $? -ne 0 ]; then
    echo "❌ Legacy seed operation failed"
    exit 1
fi

echo "✅ Legacy seed operation completed successfully"