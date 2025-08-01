#!/bin/bash

# Sync Components Script
# This script keeps webfg-player-app components in sync with webfg-gm-app
# webfg-gm-app is the source of truth for all shared components

echo "🔄 Syncing components from webfg-gm-app to webfg-player-app..."

# Source and destination directories
GM_COMPONENTS="./webfg-gm-app/src/components"
PLAYER_COMPONENTS="./webfg-player-app/src/components"
GM_TESTS="./webfg-gm-app/src/__tests__/components"
PLAYER_TESTS="./webfg-player-app/src/__tests__/components"

# Check if source directories exist
if [ ! -d "$GM_COMPONENTS" ]; then
    echo "❌ Error: GM app components directory not found: $GM_COMPONENTS"
    exit 1
fi

if [ ! -d "$GM_TESTS" ]; then
    echo "❌ Error: GM app tests directory not found: $GM_TESTS"
    exit 1
fi

# Remove existing player components and tests
echo "🗑️  Removing existing player app components and tests..."
rm -rf "$PLAYER_COMPONENTS"
rm -rf "$PLAYER_TESTS"

# Copy components from GM app to player app
echo "📋 Copying components..."
cp -r "$GM_COMPONENTS" "$PLAYER_COMPONENTS"

echo "🧪 Copying component tests..."
cp -r "$GM_TESTS" "$PLAYER_TESTS"

echo "✅ Component sync complete!"
echo ""
echo "📝 Summary:"
echo "   • Source: webfg-gm-app (single source of truth)"
echo "   • Target: webfg-player-app"
echo "   • Components: Synced ✅"
echo "   • Tests: Synced ✅"
echo ""
echo "💡 To run this sync in the future:"
echo "   bash sync-components.sh"