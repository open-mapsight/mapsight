# Verkehrszentrale Musterregion: data and behavior

All incident names, street names, positions, dates, parking capacities and occupancy
values in `data.ts` are invented MIT fixtures. The two simulation steps are fixed,
not a live feed or measured traffic information. The host's date selector changes
the supplied incident data; it does not implement the product's time-filter UI.
KPI totals describe all data in the selected period; hiding a layer only changes
the map and combined result list.

The fictional counter uses the existing Count Aggregator mock (station 150,
`Example Counter A`, `bicycleSensorTotal`). Its position is invented, and the
synthetic series has its own dates, independent from the traffic example day.
Static production hosting uses the existing same-origin service-worker mock;
development uses the Vite mock. No credentials, external feed, analytics or
municipal data are used.

The restricted basemap uses `/tiles/osm/` and retains © OpenStreetMap contributors
(ODbL) attribution. The area is chosen only for tile availability, not as a host
reference. System fonts; no external images or Font Awesome pictograms.
