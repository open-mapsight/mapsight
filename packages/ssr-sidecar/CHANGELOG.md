# @mapsight/ssr-sidecar

## 0.1.1

### Patch Changes

- c46c174: Add homepage and repository.directory metadata for npm package pages.
- b02045c: Validate render request metadata. `POST /v1/render` now answers 400 when the body is not a JSON object or when `requestId` / `assetVersion` (body or `X-Request-Id` / `X-Mapsight-Asset-Version` header) is not 1–128 printable ASCII characters, instead of failing with 500. Oversized bodies now receive the 413 `BODY_TOO_LARGE` response with `Connection: close` rather than a reset socket.

## 0.1.0

### Minor Changes

- 0f5d1c2: Add a Node 24 HTML embed sidecar with `/health`, `/v1/render`, and `/purge`.
