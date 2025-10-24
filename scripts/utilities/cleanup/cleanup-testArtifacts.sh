#!/bin/bash
# Cleanup script for testArtifacts empty folders
# Generated automatically - review before running!

set -e

echo "🧹 Cleaning up testArtifacts empty folders..."

echo "Removing: frontend/tests/e2e/visual-regression/diffs"
rm -rf "frontend/tests/e2e/visual-regression/diffs"

echo "Removing: scripts/documentation-analysis/config/__tests__"
rm -rf "scripts/documentation-analysis/config/__tests__"

echo "Removing: scripts/documentation-analysis/src/utils/__tests__"
rm -rf "scripts/documentation-analysis/src/utils/__tests__"

echo "✅ testArtifacts cleanup complete!"