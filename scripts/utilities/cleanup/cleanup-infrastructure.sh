#!/bin/bash
# Cleanup script for infrastructure empty folders
# Generated automatically - review before running!

set -e

echo "🧹 Cleaning up infrastructure empty folders..."

echo "Removing: infrastructure/environments/dev/tools"
rm -rf "infrastructure/environments/dev/tools"

echo "✅ infrastructure cleanup complete!"