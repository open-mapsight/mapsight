# Tourism scenario data and assets

The **Musterland** tourism host is fictional. No real tourism operator, authority,
customer dataset or municipal open-data source is involved.

## Separate OSM database

`osm-pois.json` is a separately licensed, hand-picked eight-feature extract from
the primary OpenStreetMap API, fetched once on **2026-10-29**:

<https://api.openstreetmap.org/api/0.6/map?bbox=10.515,52.258,10.532,52.271>

© OpenStreetMap contributors. This database is available under the
[Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
See [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright).
The extract's ODbL terms are separate from the repository's MIT application code.
The JSON is bundled and downloadable from the page; visitors never query the OSM
API. No tiles were downloaded by this extraction.

The selected entities are public museums, parks, architecture and theatres:
nodes 1238956832, 12199215628, 3067837131; ways 5563264, 23100098, 22996131,
33048725, 23095958. The file records each entity's OSM id, version, timestamp and
selected `name`, `tourism`, `amenity`, `leisure` tags. No contributor identifiers,
contact details, addresses or personal tags are retained. Way coordinates are the
arithmetic mean of their referenced node coordinates, rounded to seven decimals.
They are illustrative map positions, not verified entrances or navigation targets.
The source bbox can return complete ways extending slightly beyond that bbox.

`extract-osm.py` documents the one-time maintainer operation and writes only the
eight explicit entities, using the OSM map endpoint. It is not part of the app,
build or test workflow. Re-running it requires an intentional maintainer action.

## Editorial additions and limits

`content.ts` creates the language-specific presentation from the same eight OSM
features. Short descriptions, categories and illustrations are our own editorial
material under the repository's MIT licence. They are generic suggestions, not
verified visitor information. There are **no fictional events** mixed with the
OSM data, and no time filter or event-date claim. Opening hours, admission,
accessibility and programmes are deliberately not supplied. The two example
distance origins are host configuration, not additional POIs.

The map area is chosen **solely for existing tile-proxy coverage**:
EPSG:3857 `[1097392, 6789091, 1240635, 6895797]`, zooms 10–18. Basemap tiles
load via the existing same-origin `/tiles/osm/` proxy. The on-page credits preserve
OpenStreetMap attribution. No relationship to a real host is implied by the area.

Directions are disclosed outbound links to OpenStreetMap or a `geo:` device map
handler. Sharing uses Mapsight's supported feature permalink and share controls.
No booking, routing, itinerary or favourites service is present.

## Fonts and illustrations

Fonts: Georgia/Times New Roman for display; Trebuchet MS/Segoe UI/system sans serif
for body text. These are local device fonts; no font file or remote font request
is used. `landscape.svg` and the inline category illustrations are own SVG artwork
under MIT, drawn specifically for this scenario and not pictures of these places.

Map pictograms use the bundled Mapsight traffic-style `museum`, `parkanlage`,
`sehenswuerdigkeit` and `theater` IDs in host colours. No `fa-*` pictograms are
used. Chrome uses the product's themed-icon opt-in and token-mapped surfaces.

German `index.html` and English `en.html` are separate documents. Each sets
`html[lang]` and initializes Mapsight with that language; this does not demonstrate
or imply a runtime language-switch API.
