---
"@mapsight/lib-js": patch
"@mapsight/ui": patch
---

Tolerate malformed query parameters and throwing plugins. `getQueryStringParameter` now decodes with `decodeURIComponent` and returns the raw value when it is not valid percent-encoding instead of throwing `URIError`. Encoded reserved characters such as `%2F`, `%26`, and `%3D` are now decoded too (previously returned verbatim). A plugin phase that throws synchronously no longer skips later plugins or escapes `render()`; the error is logged with the plugin name and `renderAsync()` still rejects with it.
