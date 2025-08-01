#!/bin/bash

# Sync Components Script
# This script keeps both apps in sync with webfg-shared-components
# webfg-shared-components is the single source of truth for all shared components

echo "🔄 Syncing components from webfg-shared-components to both apps..."

# Source directories
SHARED_COMPONENTS="./webfg-shared-components/src/components"
SHARED_CONTEXT="./webfg-shared-components/src/context"
SHARED_UTILS="./webfg-shared-components/src/utils"
SHARED_TESTS="./webfg-shared-components/src/__tests__/components"

# Destination directories
GM_COMPONENTS="./webfg-gm-app/src/components"
GM_CONTEXT="./webfg-gm-app/src/context"
GM_UTILS="./webfg-gm-app/src/utils"
GM_TESTS="./webfg-gm-app/src/__tests__/components"

PLAYER_COMPONENTS="./webfg-player-app/src/components"
PLAYER_CONTEXT="./webfg-player-app/src/context"
PLAYER_UTILS="./webfg-player-app/src/utils"
PLAYER_TESTS="./webfg-player-app/src/__tests__/components"

# Check if source directories exist
if [ ! -d "$SHARED_COMPONENTS" ]; then
    echo "❌ Error: Shared components directory not found: $SHARED_COMPONENTS"
    exit 1
fi

echo "🗑️  Removing existing components from both apps..."
rm -rf "$GM_COMPONENTS" "$GM_CONTEXT" "$GM_UTILS" "$GM_TESTS"
rm -rf "$PLAYER_COMPONENTS" "$PLAYER_CONTEXT" "$PLAYER_UTILS" "$PLAYER_TESTS"

echo "📋 Copying shared components to GM app..."
cp -r "$SHARED_COMPONENTS" "$GM_COMPONENTS"
cp -r "$SHARED_CONTEXT" "$GM_CONTEXT"
cp -r "$SHARED_UTILS" "$GM_UTILS"
cp -r "$SHARED_TESTS" "$GM_TESTS"

echo "📋 Copying shared components to Player app..."
cp -r "$SHARED_COMPONENTS" "$PLAYER_COMPONENTS"
cp -r "$SHARED_CONTEXT" "$PLAYER_CONTEXT"
cp -r "$SHARED_UTILS" "$PLAYER_UTILS"
cp -r "$SHARED_TESTS" "$PLAYER_TESTS"

echo "✅ Component sync complete!"
echo ""
echo "📝 Summary:"
echo "   • Source: webfg-shared-components (single source of truth)"
echo "   • Targets: webfg-gm-app, webfg-player-app"
echo "   • Components: Synced ✅"
echo "   • Context: Synced ✅"
echo "   • Utils: Synced ✅"
echo "   • Tests: Synced ✅"
echo ""
echo "💡 To run this sync in the future:"
echo "   bash sync-components.sh"
echo ""
echo "⚠️  IMPORTANT: Always make changes in webfg-shared-components first!"
echo "   Then run this script to sync to both apps."