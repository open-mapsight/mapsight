# Bounded icon preloading experiment

Status: benchmark-only prototype; no production preload policy is installed.

```bash
pnpm exec turbo build --filter=@mapsight/traffic-style
pnpm --filter @mapsight/showcase bench:icons --suite preload \
  --repeats 5 --out tmp/icon-preloading.json
```

The [rendering benchmark](SPRITE_EVALUATION.md) explains the local HTTP/2 origin,
assets, Chromium renderer, network/CPU profiles, and post-JavaScript-boot timing
scope. This suite uses 1,000 markers with one or 21 icon ids, 15 strategies, two
profiles, five repetitions, and 300 cold-context samples. It intentionally does
not repeat the expensive 5,000-marker/direct-SVG stress case.

## What changes in this suite

- Start speculative work, then commit navigation after 0, 100, or 300 ms. Never
  wait for the preload promise before navigating. Record actual elapsed lead
  time and navigation timer delay, rather than assuming the timer was punctual.
- Try two workers (and a four-worker variant), a 32-target cap, and a 250 ms
  start deadline. Stop starting queued work on navigation. In-flight work is
  allowed to finish and can be joined by demand.
- Compare raster-cache-only preparation with preparing the resulting image in
  OpenLayers' image cache too. Sprite and individual-PNG paths also receive
  preparation, so the comparison does not give only runtime icons a head start.
- Try wrong colored-icon forecasts, capped at eight targets, and an abandoned
  forecast stopped after 25 ms. Record unused completed targets, cache misses,
  and actual peak concurrency; assert target/concurrency limits and HTTP/2 image
  request counts. All cases must render a non-empty canvas and finish normally.
- Record animation-frame intervals during the lead window. The prototype has
  bounded workers but **no production idle/input scheduler**. Timer delay and
  frame intervals are laboratory contention probes, not field INP measurements.

Lead time means time between preparation starting and navigation, not total hover
or dwell duration. Feature data and icon ids are already known in this experiment.
A real source-fetch/parse waterfall can consume some or all of that opportunity.
Map setup and OpenLayers feature construction are also outside timed navigation;
this suite isolates the image preparation/rendering path.
Full application boot, SSR, network contention from other assets, and active
React/list/map interactions before navigation are outside this harness.

## Results

Reference run: Chromium 156.0.8078.4 on AMD Ryzen 5 3600XT 6-Core Processor. The table shows medians of five runs on the simulated slower profile (4x CPU, 80 ms latency, 1.6 Mbit/s), 1,000 markers, and 21 distinct icon ids. The [CSV summary](benchmarks/icon-preloading-2026-10-30.csv) contains all cases and timing ranges; [run metadata](benchmarks/icon-preloading-2026-10-30.json) includes every policy and the raw-result checksum.

| Strategy                                   | Navigation → all icons (ms) | Intent → all icons (ms) | Rasters / map images ready at navigation |
| ------------------------------------------ | --------------------------: | ----------------------: | ---------------------------------------: |
| Runtime: demand only                       |                       449.6 |                   449.6 |                                        — |
| Raster only: 0 ms lead, 2 workers          |                       354.9 |                   359.9 |                                    0 / 0 |
| Raster only: 100 ms lead, 2 workers        |                       292.9 |                   408.6 |                                   15 / 0 |
| Raster only: 300 ms lead, 2 workers        |                       146.0 |                   446.3 |                                   21 / 0 |
| Raster + map image: 100 ms lead, 2 workers |                       457.5 |                   561.4 |                                  11 / 10 |
| Raster + map image: 300 ms lead, 2 workers |                       107.4 |                   407.8 |                                  21 / 21 |
| Sprite: demand only                        |                       345.7 |                   345.7 |                                        — |
| Sprite: 300 ms lead                        |                       115.4 |                   415.7 |                                   — / 21 |
| PNG files: demand only                     |                       438.5 |                   438.5 |                                        — |
| PNG files: 300 ms lead, 2 workers          |                       389.4 |                   689.6 |                                    — / 4 |

At 100 ms lead, two raster workers prepared 15 of 21 rasters by navigation and the navigation timer ran 10.6 ms late (median). Four workers prepared 16, with 24.6 ms median timer delay. The faster final image readiness does not establish better interaction responsiveness; a production scheduler needs to yield to input/foreground work.

The completely wrong forecast produced 8 unused prepared targets and 29 total raster generations for 21 useful icons. Stopping the abandoned forecast after 25 ms left a median of 3 unused targets (maximum 4). Work already in flight finished; the prototype cancelled queued work, not active consumers or underlying rasterization. Correct predictions generated 21 total rasters, not a duplicate set for prefetch and navigation.

**Finding:** sufficient lead time can bring runtime icons close to an equally preloaded sprite, particularly when both raster and map-image stages are ready. A short opportunity can help only part of the pipeline, or compete with it: at 100 ms the full image-preparation strategy did not improve complete-set time over demand alone in this run. Two PNG fetch/decode workers also left most images cold at commitment. The admission/concurrency policy needs to reflect the resource and confidence, rather than use one universal queue size.

## Consequences

Targeted preparation can reduce post-navigation waiting, but does not make the
work free. Measure from both intent and commitment, including wrong predictions.
Do not deliberately delay navigation to manufacture a 300 ms head start.

Raster creation and map image decoding are separate stages. Preparing every
stage at once is not automatically best: at short lead times, image decode can
consume the opportunity that would otherwise prepare more rasters. Likewise,
a small network pool can show a few PNGs early without making the full set ready.

The next useful step is a small real destination adapter that shares the existing
document cache with normal demand, followed by scoped icon preparation. See the
[broader strategy](../../../docs/integration/PRELOADING.md) for SSR, hydration,
lists, layers, route intent, budgets, and the boundaries of a shared coordinator.
