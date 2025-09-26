#!/bin/bash

# Legacy Data Management Script Wrapper (Linux/Unix)
# Maintains compatibility with existing Docker integration

echo "⚠️  DEPRECATION NOTICE: This script is deprecated"
echo "Please use the new npm commands (npm run setup-data, npm run reset-data, etc.)"
echo "Running via compatibility layer..."
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to scripts directory
cd "$SCRIPT_DIR/.."

# Execute via backward compatibility layer
node backward-compatibility.js data-management "$@"

# Check exit code
if [ $? -ne 0 ]; then
    echo "❌ Legacy data management operation failed"
    exit 1
fi

echo "✅ Legacy data management operation completed successfully"