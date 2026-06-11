function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Failed to rasterize SVG icon"));
		image.src = url;
	});
}

/** Rasterize the SVG at the target pixel size so vectors stay crisp (not upscaled). */
export function prepareSvgForRasterization(
	svg: string,
	pixelWidth: number,
	pixelHeight: number,
): string {
	return svg.replace(
		/<svg(\s[^>]*)?>/,
		(_match: string, attrs: string = "") => {
			const cleaned = attrs
				.replace(/\swidth="[^"]*"/g, "")
				.replace(/\sheight="[^"]*"/g, "");
			return `<svg${cleaned} width="${pixelWidth}" height="${pixelHeight}">`;
		},
	);
}

export async function rasterizeSvg(
	svg: string,
	logicalWidth: number,
	logicalHeight: number,
	pixelRatio = 1,
): Promise<{dataUrl: string; width: number; height: number}> {
	if (typeof document === "undefined") {
		throw new Error("rasterizeSvg requires a browser DOM environment");
	}

	const width = Math.round(logicalWidth * pixelRatio);
	const height = Math.round(logicalHeight * pixelRatio);
	const rasterSvg = prepareSvgForRasterization(svg, width, height);
	const blob = new Blob([rasterSvg], {type: "image/svg+xml;charset=utf-8"});
	const url = URL.createObjectURL(blob);

	try {
		const image = await loadImage(url);
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext("2d");
		if (!context) {
			throw new Error("Canvas 2D context unavailable");
		}
		context.imageSmoothingEnabled = false;
		context.drawImage(image, 0, 0, width, height);
		return {
			dataUrl: canvas.toDataURL("image/png"),
			width,
			height,
		};
	} finally {
		URL.revokeObjectURL(url);
	}
}
