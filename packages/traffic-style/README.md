# @mapsight/traffic-style

For SCSS/CSS syntax and semantics, see @mapsight/vector-style-compiler.

## Style function (SCSS/JS)

You have basically four options to include this in your project:

1. Use `import '@mapsight/traffic-style/default'` which is the precompiled map style
2. Compile a style yourself from SCSS using `@mapsight/vector-style-compiler`
    - `_full.scss` is the complete style (like `default`)
    - `_base.scss` is a base selection of styles
3. Compile a style yourself from SCSS using `@mapsight/vector-style-compiler`
    - using only parts of `src/scss/*`

## Icons (SCSS/PNG)

You have basically two options to include this in your project:

1. use the icon sprites described in `mapsight-traffic-style-icon-sprite-1x.scss` and `mapsight-traffic-style-icon-sprite-2x.scss` and
   the corresponding sprite images at `img/mapsight-traffic-style-icon-sprite-1x.png` and `img/mapsight-traffic-style-icon-sprite-2x.png` (which are already optimized)
2. use the separate icon images in `img/mapsight-icons/*.png`, `img/mapsight-icons-2x/*.png` and `img/mapsight-icons/*.svg` (which are also already optimized)

# Development

## How to add a new icon

1. Add **vector based** Icon symbol to `docs/icons.sketch` file and export the symbols (see others for reference)
2. Add SVGs (at least `-default.svg` and `-plain.svg`, optionally `-small.svg` and `-xsmall.svg`) to `img/mapsight-icons-svg/`
3. Add 1x PNGs (at least `-default.png` and `-plain.png`, optionally `-small.png` and `-xsmall.png`) to `img/mapsight-icons/`
4. Add 2x PNGs (at least `-default.png` and `-plain.png`, optionally `-small.png` and `-xsmall.png`) to `img/mapsight-icons-2x/`
5. Describe new icon in `src/meta.json`
6. Optionally add them to the fallback map in `src/scss/_variables.scss`
7. Search and replace cache busting strings in `src/scss/**` in the format `?v=xxxx-xx-xx-xx-xx` TODO: Automate or at least centralize in one file!
8. Build everything using `pnpm run clean-build`

## How to publish

- Publish:

```
git status
git commit
pnpm version x.x.x|major|minor|patch
pnpm run publish
git push
git push --tags
```
