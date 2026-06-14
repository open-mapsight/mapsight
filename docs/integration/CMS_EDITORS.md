# For CMS editors

You paste **HTML snippets** into CMS pages. You do **not** rebuild JavaScript.

If something breaks, **stop editing** and contact your web or GIS team — do not guess at script changes.

---

## Safe to change (with care)

| Field                               | Example                         | Notes                                        |
| ----------------------------------- | ------------------------------- | -------------------------------------------- |
| Map center / zoom in preset options | `startCoordinates`, `startZoom` | Only if your team trained you on coordinates |
| `imagesUrl`                         | `/mapsight-assets/img/`         | Must match where icons are deployed          |
| GeoJSON URLs in config              | `/data/events.json`             | Only URLs **approved by web/GIS**            |
| Surrounding page copy               | Headlines, intro text           | Normal CMS editing                           |

---

## Do not change

| Item                                         | Why                                       |
| -------------------------------------------- | ----------------------------------------- |
| `<script type="module">` import paths        | Wrong path → blank map                    |
| `import browserEmbed from "…/embed.js"`      | Stable entry — IT updates on deploy       |
| Preset import (`simpleMap`, …)               | Wrong preset → wrong UI                   |
| Container `id`                               | Must match `getElementById` in the script |
| JavaScript syntax (brackets, quotes, commas) | Breaks the entire snippet                 |
| CSS class names used for layout              | May break host styling                    |

---

## CMS HTML filters

Many CMS “clean HTML” modes strip `<script type="module">` or alter quotes.

- If the snippet **disappears or breaks after save**, do not keep retrying.
- Ask IT to allow module scripts for that content type, or paste via a **raw HTML** / **code** element.

---

## When to call IT

| Situation                                             | Contact IT          |
| ----------------------------------------------------- | ------------------- |
| Map blank after paste                                 | ✓                   |
| Need a **new** map type (different preset)            | ✓                   |
| New data layer or changed GeoJSON URL                 | ✓ (often GIS + web) |
| IT published updated snippets — replace whole snippet | ✓                   |
| Change basemap or legal attribution                   | ✓                   |
| Adjust map center only                                | Maybe — if trained  |

---

## Source of truth

IT shares reference snippets from the latest build (`dist/snippets/*.html`). Copy the **full current snippet** after
each deploy — do not reuse fragments from old pages without checking.

---

## Related

- [CMS embed pattern (IT)](CMS_PHP.md)
- [Publishing data](PUBLISHING_DATA.md)
