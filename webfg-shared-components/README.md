# WEBFG Shared Components

This directory contains all shared React components, context, and utilities used by both the GM app and Player app.

## Architecture

This is the **single source of truth** for all shared code:

- **Components**: All React components (forms, lists, views, etc.)
- **Context**: React context providers for state management  
- **Utils**: Utility functions and helpers
- **Tests**: Component test suites

## Usage

### Making Changes

1. **Always edit files in this directory first**
2. **Never edit components directly in the apps** - they will be overwritten
3. **Run the sync script after making changes**:
   ```bash
   bash ../sync-components.sh
   ```

### Sync Script

The `sync-components.sh` script copies all shared code to both apps:
- `webfg-shared-components/src/` → `webfg-gm-app/src/`
- `webfg-shared-components/src/` → `webfg-player-app/src/`

### Testing

Tests are included in the sync process. When you run the sync script:
- Component tests are copied to both apps
- Both apps can run their test suites independently
- Tests remain identical across both applications

## Directory Structure

```
webfg-shared-components/
├── src/
│   ├── components/
│   │   ├── actions/        # Action-related components
│   │   ├── characters/     # Character management components
│   │   ├── common/         # Reusable UI components
│   │   ├── conditions/     # Condition components
│   │   ├── encounters/     # Encounter and VTT components
│   │   ├── forms/          # Form components
│   │   ├── nav/            # Navigation components
│   │   ├── objects/        # Object management components
│   │   └── thoughts/       # Thought components
│   ├── context/
│   │   ├── RecentlyViewedContext.jsx
│   │   └── SelectedCharacterContext.jsx
│   ├── utils/
│   │   └── diceMapping.js
│   └── __tests__/
│       ├── components/     # Component tests (mirror components structure)
│       ├── context/        # Context tests
│       └── utils/          # Utility tests
├── package.json
├── README.md
└── index.js               # Export all components and utilities
```

## Important Notes

⚠️ **Never edit components in the individual apps** - they are copies that get overwritten

✅ **Always make changes here first**, then sync

🔄 **Run `bash ../sync-components.sh` after any changes**

📋 **Both apps use identical copies** - this ensures consistency across the platform