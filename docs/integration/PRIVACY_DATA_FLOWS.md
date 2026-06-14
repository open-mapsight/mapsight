# Privacy and visitor data flows

Overview of **what a visitor’s browser loads** when viewing a Mapsight embed on your site. Mapsight itself does **not**
send analytics or telemetry to Mapsight maintainers.

This is **host documentation**, not legal advice. Your privacy policy and DSGVO records must reflect your deployment.

---

## Mapsight framework

| Data                                         | Leaves visitor browser?           |
| -------------------------------------------- | --------------------------------- |
| Mapsight npm runtime (JS/CSS from your host) | Loaded from **your origin** only  |
| Mapsight telemetry                           | **None** built into the framework |

---

## Typical requests (by pattern)

| Source                        | What loads                                | Notes                                               |
| ----------------------------- | ----------------------------------------- | --------------------------------------------------- |
| **Embed assets**              | `embed.js`, chunks, `mapsight.css`, icons | Same-origin recommended                             |
| **Thematic data**             | GeoJSON / API URLs in `featureSources`    | You control URL and logging                         |
| **Basemap A — tile-proxy**    | `GET /tiles/…` on **your host**           | Upstream OSM/vendor contacted **server-side** only  |
| **Basemap B — direct XYZ**    | Third-party tile URL from config          | **Each visitor** hits upstream (ToS, IP disclosure) |
| **Basemap C — GeoServer WMS** | Your GeoServer or proxied WMS             | Same-origin or proxied preferred                    |
| **Optional platform API**     | Your Laravel/API host                     | See [DATA_BACKEND](DATA_BACKEND.md)                 |
| **User geolocation**          | Browser permission → optional layer       | Only if enabled in config                           |

> **Tile-proxy privacy win:** With pattern A, the visitor’s browser requests basemap tiles **only from your host**.
> Upstream tile servers are fetched by **your server**, not directly by each client. See [TILE_PROXY](TILE_PROXY.md).

Basemap decision table: [Ecosystem § basemaps](../architecture/ECOSYSTEM.md).

---

## SSR sidecar (optional)

When CMS server-side rendering is used, embed options may be **POSTed to an internal render service**. That JSON crosses
a **trust boundary** inside your infrastructure — not to Mapsight third parties.

- Keep dehydrated state **size-bounded** (no full GeoJSON in SSR payload if avoidable)
- Do not embed secrets in serialized state
- See [SSR hydration](SSR_HYDRATION.md)

---

## DSGVO template paragraph (hosts)

_Adapt for your privacy notice:_

> Interactive maps on our website are provided using the open-source Mapsight framework, operated on our own servers.
> Map scripts and styles are loaded from [your domain]. Location data displayed on the map is retrieved
> from [describe GeoJSON/API sources]. Basemap tiles are
> served [via our tile cache at /tiles/ | from OpenStreetMap with attribution | from our GeoServer]. We do not use
> Mapsight to transmit personal data to external map platform vendors by default. If you enable browser location on the
> map, your device’s location is processed locally in your browser subject to your permission.

---

## Related

- [TILE_PROXY](TILE_PROXY.md)
- [GIS stack choices § privacy](../ecosystem/GIS_STACK_CHOICES.md)
- [Licensing](../LICENSING.md)
