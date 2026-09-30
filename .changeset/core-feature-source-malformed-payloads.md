---
"@mapsight/core": patch
---

Recover feature sources from malformed payloads. The xhr-json loader now rejects non-object bodies and non-array `features` with `XhrJsonPayloadError`, feature indexing skips non-object entries, and a throwing success dispatch now records a load error instead of leaving the source loading forever.
