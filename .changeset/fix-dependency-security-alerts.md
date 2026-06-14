---
"@mapsight/lib-redux": patch
"@mapsight/vector-editor": patch
---

Fix dependency security alerts by resolving `shell-quote` to the patched release and upgrading the vector editor tooltip dependency to remove the vulnerable `uuid` transitive dependency.
