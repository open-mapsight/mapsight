---
"@mapsight/ui": minor
---

Add opt-in compact feature-source indexes to nodeEmbed dehydration. The wire
snapshot omits ids/featuresById while retaining source collections, metadata,
selections, combined data, and edit history. Existing core normalization restores
indexed runtime state before React hydration; full snapshots remain the default.
