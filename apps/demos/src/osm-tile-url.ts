/** Public build-time setting; local development keeps the direct OSM source. */
export const osmTileUrl =
	import.meta.env.VITE_DEMOS_OSM_TILE_URL ??
	"https://tile.openstreetmap.org/{z}/{x}/{y}.png";
