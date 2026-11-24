---
"@mapsight/ui": minor
---

Add `wmsCapabilitiesToLayers` (`@mapsight/ui/config/ogc/wms`) and `wmtsCapabilitiesToLayers` (`@mapsight/ui/config/ogc/wmts`). They turn a WMS or WMTS capabilities document, supplied by the host application, into plain data and ready-to-use layer definitions; text from the document is returned as data only and never written to `metaData`. The optional `queryable` field of a WMS entry is omitted when it is not known (for example for an already parsed object); parameters that the WMS source generates itself are removed from the `GetMap` URL; WMTS layers with malformed tile matrix data are left out; identifiers are compared case-sensitively.
