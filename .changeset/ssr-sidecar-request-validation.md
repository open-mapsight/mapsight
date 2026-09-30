---
"@mapsight/ssr-sidecar": patch
---

Validate render request metadata. `POST /v1/render` now answers 400 when the body is not a JSON object or when `requestId` / `assetVersion` (body or `X-Request-Id` / `X-Mapsight-Asset-Version` header) is not 1–128 printable ASCII characters, instead of failing with 500. Oversized bodies now receive the 413 `BODY_TOO_LARGE` response with `Connection: close` rather than a reset socket.
