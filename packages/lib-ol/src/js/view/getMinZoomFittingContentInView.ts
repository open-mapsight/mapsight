import {getHeight, getWidth} from "ol/extent";
import {get as projGet} from "ol/proj";

function getBaseLog(x: number, base: number) {
	return Math.log(x) / Math.log(base);
}

/**
 * @param contentExtentWidth contentExtentWidth
 * @param contentExtentHeight contentExtentHeight
 * @param viewWidth viewWidth
 * @param viewHeight viewHeight
 * @param options options
 * @returns zoom
 */
export default function getMinZoomFittingContentInView(
	contentExtentWidth: number,
	contentExtentHeight: number,
	viewWidth: number,
	viewHeight: number,
	{
		zoomFactor = 2,
		projectionCode = "EPSG:3857",
		tileSize = 256,
		minZoom = 0,
	} = {},
) {
	const maxResolutionX = contentExtentWidth / viewWidth;
	const maxResolutionY = contentExtentHeight / viewHeight;
	const maxResolution = Math.max(maxResolutionX, maxResolutionY);

	const projection = projGet(projectionCode);
	if (!projection) {
		throw Error("projection missing");
	}

	const projectionExtent = projection.getExtent();
	const projectionExtentSizeMax = Math.max(
		getWidth(projectionExtent),
		getHeight(projectionExtent),
	);

	return getBaseLog(
		projectionExtentSizeMax /
			tileSize /
			Math.pow(zoomFactor, minZoom) /
			maxResolution,
		zoomFactor,
	);
}
