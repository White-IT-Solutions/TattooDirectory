#!/bin/bash
# Cleanup script for docStructure empty folders
# Generated automatically - review before running!

set -e

echo "🧹 Cleaning up docStructure empty folders..."

echo "Removing: docs/consolidated/architecture/diagrams"
rm -rf "docs/consolidated/architecture/diagrams"

echo "Removing: docs/consolidated/troubleshooting/localstack"
rm -rf "docs/consolidated/troubleshooting/localstack"

echo "✅ docStructure cleanup complete!"