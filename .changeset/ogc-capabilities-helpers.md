---
"@mapsight/ui": minor
---

Add `wmsCapabilitiesToLayers` (`@mapsight/ui/config/ogc/wms`) and `wmtsCapabilitiesToLayers` (`@mapsight/ui/config/ogc/wmts`). They turn a WMS or WMTS capabilities document, supplied by the host application, into plain data and ready-to-use layer definitions; text from the document is returned as data only and never written to `metaData`.
