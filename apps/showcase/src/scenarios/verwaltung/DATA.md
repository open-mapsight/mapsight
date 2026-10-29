# Musterstadt fixture and third-party assets

20 invented service points, placed irregularly within about 3 km of the showcase map centre (seeded pseudo-random, seed 20261029, at least 450 m apart), inside the allowed EPSG:3857 coverage. Positions do not correspond to real service offices. Names, hours, tasks and access statements are fictional. No municipal or customer dataset, real address or phone number. Hand-authored fixture under the repository MIT licence; no external retrieval.

Basemap: OpenStreetMap, ODbL, existing same-origin tile proxy and attribution. Allowed bbox [1097392, 6789091, 1240635, 6895797], zoom 10–18. Coverage implies no relationship with the real municipalities there.

KERN: npm registry checked 2026-10-29: @kern-ux/native latest 2.8.2, EUPL-1.2. Its dist/kern.min.css is copied byte-for-byte to public/vendor/kern. No KERN JS, header bar, logo, illustrations or website copy is used. All page copy is original. Bundled CSS contains upstream icon definitions; host markup does not request KERN icons. See shipped NOTICE.txt and EUPL-1.2.md, upstream source https://gitlab.opencode.de/kern-ux/kern-ux-plain and exact npm source archive linked in NOTICE. Fira Sans is self-hosted from the package; OFL copied from https://github.com/mozilla/Fira/blob/master/LICENSE (2026-10-29). No Font Awesome pictograms used in this scenario.

KERN assets are separate licensed upstream files, excluded from the host CSS pipeline. Our host overrides are host.scss. To update, deliberately replace public/vendor/kern from the pinned package and retain notices/licences; do not edit the vendor CSS.
