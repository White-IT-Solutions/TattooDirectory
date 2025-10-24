#!/bin/bash
# Cleanup script for appStructure empty folders
# Generated automatically - review before running!

set -e

echo "🧹 Cleaning up appStructure empty folders..."

echo "Removing: frontend/src/app/home"
rm -rf "frontend/src/app/home"

echo "✅ appStructure cleanup complete!"