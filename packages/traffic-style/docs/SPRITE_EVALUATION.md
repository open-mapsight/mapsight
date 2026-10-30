# Sprite rendering evaluation

Status: measured spike and proposed migration direction, not a removal in this PR.

The question is whether packing default icons into a PNG atlas improves map UX,
not whether repeatedly drawing unprepared SVGs is free. Those are separate costs.
The public [CSS migration proposal](../../../docs/architecture/decisions/009-native-css-over-scss.md)
mentions sprite-generated SCSS as migration work; it does not decide to remove
sprites.

## Reproduce

From the repository root, with Node 24, pnpm, OpenSSL, and Playwright Chromium:

```bash
pnpm exec turbo build --filter=@mapsight/traffic-style
pnpm --filter @mapsight/showcase exec playwright install chromium
pnpm --filter @mapsight/showcase bench:icons \
  --repeats 5 --frames 30 --out tmp/icon-rendering.json
```

The runner serves a temporary local HTTP/2 origin, closes it afterward, and writes
raw per-run timings. It uses the package's actual sprite, individual PNG files,
`uiIconSrc`, and `mapsightRuntimeIcon`/bitmap cache. No external map tiles or
services participate. An ephemeral self-signed certificate is used only for the
local benchmark origin.

The four paths are:

- **Sprite:** one 2x atlas, cropped with its actual SCSS tile coordinates.
- **Individual PNG:** the same default icons from separate pre-baked 2x files.
- **Direct SVG:** composed SVG data URLs passed directly to OpenLayers.
- **Runtime PNG:** the current SVG → canvas → PNG data URL pipeline and cache.

All paths use the same OpenLayers canvas vector layer, shared styles per icon id,
positions, dimensions, DPR 2, and 1280 × 960 viewport. Cold runs use a new browser
context for each path. Warm runs recreate the map in the same context, retaining
image and runtime caches. Each repetition rotates path order. The cases use
1,000 features with one or 21 icon ids, and a deliberately dense 5,000-feature
stress case with 21 ids. Decluttering is disabled in every path.

The desktop profile has no artificial throttling. The mobile simulation uses 4x
CPU slowdown, 80 ms network latency, and 1.6 Mbit/s download throughput. It is not
a physical phone. The harness and shared JavaScript have loaded before timing
and throttling begin: these measurements isolate icon preparation, image
transfer, and rendering, not total application boot or bundle parsing.

First/all-icon timings are the first map `postrender` with respectively any/all
required icon image styles loaded, excluding the transparent runtime placeholder.
A non-empty canvas is checked after measurement. Pan cost is synchronous
`renderSync()` time during animation-frame-driven center changes; frame intervals
are also recorded. These are rendering probes, not browser FCP or field INP.

## Results

The checked-in result summary records the machine, browser, run parameters,
medians, and ranges. Raw output is produced by the command above.

Reference run: 2026-10-30, Chromium 156.0.8078.4, AMD Ryzen 5 3600XT 6-Core Processor, five repetitions per case/path/profile/cache state, 30 pan frames per run, 240 samples total. The reference uses the legacy default asset build: the 2x sprite is 27009 bytes; the 21 individual default PNGs total 34378 bytes. The shared harness bundle is excluded from timings and transfers reported below. Current authored builds can change PNG encoding and pack additional fallback tiles; use `--assets /path/to/baseline/package` to select an archived build.

The [summary JSON](benchmarks/icon-rendering-2026-10-30.json) contains every case, run ranges, and the raw result checksum. Values below are medians across five runs. Pan values are medians of per-run medians; tiny differences with overlapping ranges are not evidence of an advantage.

Simulated mobile, 1,000 markers, 21 icon types:

| Path           | Cold first icons (ms) | Cold all icons (ms) | Warm pan render (ms) |
| -------------- | --------------------: | ------------------: | -------------------: |
| Sprite         |                 344.5 |               344.5 |                  9.8 |
| Individual PNG |                 195.4 |               415.6 |                  9.9 |
| Direct SVG     |                 197.9 |               197.9 |                 23.6 |
| Runtime PNG    |                 451.4 |               451.4 |                 10.8 |

For the one-icon case, cold completion is 348.0 ms for the atlas versus 210.0 ms for an individual PNG: loading the full sheet is unnecessary work. In the 5,000-marker stress case, warm pan medians are 141.8 ms for the atlas, 92.3 ms for individual PNGs, 97.7 ms for runtime PNGs, and 685.5 ms for direct SVG. The latter is a deliberately crowded map, not a typical UI list.

**Finding:** the atlas still has a measurable cold _complete-set_ advantage over the current runtime rasterizer and separate PNGs when many types are needed. Individual PNGs paint progressively earlier, and no warm-pan advantage appears for the atlas in the 1,000-marker case. It is slower than individual/cached PNGs in the dense stress case. Preparing raster images once matters more than putting them in a sheet; replacing the sheet with direct SVG drawing is not a sound dense-map default.

This does not prove zero UX cost for removing sprites. A sprite-free release should explicitly address cold preparation/transfer rather than assume today's lazy runtime path is an equivalent replacement. These local headless Chromium measurements do not establish physical-phone, other-browser, or WebGL performance.

## Migration direction

A sprite-free major release should preserve prepared raster images for dense
canvas maps. The source of truth can still be SVG compositions: a PNG is a
rendering artifact, not the authored artwork.

A focused migration would:

1. Make repository-owned bases, symbols, per-size adjustments, default colors,
   and fallbacks authoritative for every icon. The sign compositions in this PR
   cover traffic and parking; flags, `ort`, and `stadtteil` still need migration.
2. Keep compact feature ids and independent color overrides stable. Use one map
   icon-source entry point, with cached rasters for custom colors and an explicit
   cold-start strategy for defaults: selected-icon prewarming or individually
   pre-baked PNGs. Sparse list/UI icons can keep synchronous SVG sources.
3. Remove sprite offsets, tile maps, generated sprite SCSS, the atlas build, and
   sprite-only public customization APIs in a major version. Document replacement
   paths for custom asset builds, size/fallback mappings, and existing host SCSS.
4. Gate the switch on cold and warm map/list checks, zoom variants, dynamic-color
   workloads, and traces on real lower-end devices. Preserve raster parity where
   geometry is unchanged. Avoid treating this single synthetic canvas workload
   as proof about all GPUs, browsers, hosts, or WebGL renderers.

The current PR can establish the authored SVG model independently of that major
release. It keeps compatibility assets and default sprite routing while making
both default files and runtime overrides come from the same sign definitions.
