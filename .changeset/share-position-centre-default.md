---
"@mapsight/ui": minor
---

“Share place” (`SharePositionLinkButton`) now shares the map centre right away: the link is visible as soon as the tool opens and follows the map until the user clicks the map (or presses Space/Enter with keyboard drawing) to mark a place. Another click moves the marked place, and “Remove marker” returns to sharing the centre, so the separate “Share map centre” button is gone. The link has a visible label (“Link to the map centre” / “Link to the marked place”, new optional `label` on `LinkShare`), the keyboard help stays last, and marking a place no longer selects the marker, so its feature details do not open over the tool.
