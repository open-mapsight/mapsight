import type ImageTile from "ol/ImageTile.js";
import type Tile from "ol/Tile.js";

type TileCanvas = {
	dispatchEvent: (event: Event) => boolean;
	getContext: (id: "2d") => CanvasRenderingContext2D | null;
	height: number;
	width: number;
};

/**
 * Worker-path XYZ loader with an explicit User-Agent.
 * Does not patch global `fetch`.
 */
export function createXyzTileLoadFunction(userAgent: string) {
	return (tile: Tile, src: string) => {
		const imageTile = tile as ImageTile;
		const crossOrigin = imageTile.getCrossOrigin();
		let mode: RequestMode = "same-origin";
		let credentials: RequestCredentials = "same-origin";
		if (crossOrigin === "anonymous" || crossOrigin === "") {
			mode = "cors";
			credentials = "omit";
		} else if (crossOrigin === "use-credentials") {
			mode = "cors";
			credentials = "include";
		}

		void fetch(src, {
			mode,
			credentials,
			headers: {"user-agent": userAgent},
			referrerPolicy: imageTile.getReferrerPolicy(),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}
				return response.blob();
			})
			.then((blob) => createImageBitmap(blob))
			.then((imageBitmap) => {
				const canvas = imageTile.getImage() as unknown as TileCanvas;
				canvas.width = imageBitmap.width;
				canvas.height = imageBitmap.height;
				const context = canvas.getContext("2d");
				if (!context) {
					throw new Error(
						"tile canvas getContext('2d') returned null",
					);
				}
				context.drawImage(imageBitmap, 0, 0);
				if (
					"close" in imageBitmap &&
					typeof imageBitmap.close === "function"
				) {
					imageBitmap.close();
				}
				canvas.dispatchEvent(new Event("load"));
			})
			.catch(() => {
				const canvas = imageTile.getImage() as unknown as TileCanvas;
				canvas.dispatchEvent(new Event("error"));
			});
	};
}
