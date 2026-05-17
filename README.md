# Mapsight

<img width="3220" height="1490" alt="Mapsight - Open-Source - Acessible - Privacy First" src="https://github.com/user-attachments/assets/fa502ac3-d160-47ab-8c83-e8504649517e" />

[![CI](https://github.com/open-mapsight/mapsight/actions/workflows/ci.yml/badge.svg)](https://github.com/open-mapsight/mapsight/actions/workflows/ci.yml)

## Packages

- **`lib-js`**: Core JavaScript utilities
- **`lib-ol`**: OpenLayers utilities
- **`lib-redux`**: Redux helpers
- **`core`**: Core
- **`ui`**: UI
- **`vector-style-compiler`**: CSS → OL StyleFunction compiler
- **`traffic-style`**: Default style package (icons and vector styles)

## Development

```bash
# Install with pnpm
pnpm install

# Run all tests & checks
pnpm test
pnpm lint
pnpm typecheck

# Watch mode
pnpm watch

# Build everything
pnpm build

# Build single package
pnpm --filter @mapsight/vector-style-compiler build+
```

**Important**: Always use `pnpm` (not npm) and `pnpx` (not npx) in this workspace.

## Documentation

- **Vector Style Compiler**: [packages/vector-style-compiler/README.md](packages/vector-style-compiler/README.md)

## Package publish order

Skip steps if there are no changes for that package:

1. `lib-js`
2. `lib-ol`, `lib-redux`
3. `core`
4. `ui`, `vector-style-compiler`
5. `traffic-style`
