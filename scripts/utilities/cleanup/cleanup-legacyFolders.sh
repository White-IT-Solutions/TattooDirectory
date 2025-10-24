#!/bin/bash
# Cleanup script for legacyFolders empty folders
# Generated automatically - review before running!

set -e

echo "🧹 Cleaning up legacyFolders empty folders..."

echo "Removing: scripts/temp-test-data"
rm -rf "scripts/temp-test-data"

echo "Removing: scripts/test-backups"
rm -rf "scripts/test-backups"

echo "Removing: scripts/__tests__/test-state"
rm -rf "scripts/__tests__/test-state"

echo "✅ legacyFolders cleanup complete!"