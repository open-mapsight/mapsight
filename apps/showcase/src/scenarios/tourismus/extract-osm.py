"""One-time maintainer extract. Run intentionally; never used by the browser/build.

Database output: ODbL 1.0, © OpenStreetMap contributors. No tile downloads.
"""

import datetime
import json
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET

SOURCE = "https://api.openstreetmap.org/api/0.6/map?bbox=10.515,52.258,10.532,52.271"
SELECTED = [
    ("node", "1238956832"), ("node", "12199215628"),
    ("way", "5563264"), ("way", "23100098"),
    ("way", "22996131"), ("way", "33048725"),
    ("way", "23095958"), ("node", "3067837131"),
]

request = urllib.request.Request(
    SOURCE, headers={"User-Agent": "MapsightShowcaseFixture/1.0 (one-time educational showcase extract)"}
)
with urllib.request.urlopen(request, timeout=45) as response:
    document = ET.fromstring(response.read())
nodes = {node.attrib["id"]: node for node in document.findall("node")}
features = []
for entity_type, entity_id in SELECTED:
    entity = next(item for item in document.findall(entity_type) if item.attrib["id"] == entity_id)
    coordinates = [(float(entity.attrib["lon"]), float(entity.attrib["lat"]))] if entity_type == "node" else [
        (float(nodes[ref.attrib["ref"]].attrib["lon"]), float(nodes[ref.attrib["ref"]].attrib["lat"]))
        for ref in entity.findall("nd")
    ]
    features.append({
        "type": "Feature", "id": f"osm-{entity_type}-{entity_id}",
        "geometry": {"type": "Point", "coordinates": [
            round(sum(coordinate[index] for coordinate in coordinates) / len(coordinates), 7)
            for index in (0, 1)
        ]},
        "properties": {
            "osmType": entity_type, "osmId": int(entity_id),
            "osmVersion": int(entity.attrib["version"]), "osmTimestamp": entity.attrib["timestamp"],
            "coordinateMethod": "node" if entity_type == "node" else "mean-of-way-nodes",
            "tags": {tag.attrib["k"]: tag.attrib["v"] for tag in entity.findall("tag")
                     if tag.attrib["k"] in ("name", "tourism", "amenity", "leisure")},
        },
    })
output = {
    "type": "FeatureCollection", "attribution": "© OpenStreetMap contributors",
    "license": "https://opendatacommons.org/licenses/odbl/1-0/",
    "extractedAt": datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
    "source": SOURCE, "features": features,
}
Path(__file__).with_name("osm-pois.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
