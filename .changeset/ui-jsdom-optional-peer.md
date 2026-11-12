---
"@mapsight/ui": minor
---

Browser-only hosts no longer install `jsdom` through `@mapsight/ui`; it is now an optional peer dependency. Hosts that import `@mapsight/core/env/ssr-simulated-browser` for server-side rendering must have `jsdom` in their own dependencies.
