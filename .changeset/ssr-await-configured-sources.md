---
"@mapsight/ui": patch
---

Avoid SSR renderAsync timeouts when a disabled/default list references an
unconfigured feature source, or an ordinary load would skip an already-failed
source. Continue awaiting configured first-paint data and combined members, and
preserve explicit forced-refresh retries.
