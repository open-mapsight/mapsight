function renderSquareBackground(colors, rx, rect, plain) {
	const {x, y, size} = rect;
	if (plain) {
		return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${colors.background}" stroke="#ffffff" stroke-width="1.5"/>`;
	}
	return (
		`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${colors.background}" stroke="#000000" stroke-width="2"/>` +
		`<rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="${Math.max(0, rx - 0.5)}" fill="${colors.background}" stroke="#ffffff" stroke-width="1"/>`
	);
}
function renderCircleBackground(colors, cx, cy, r) {
	return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors.background}" stroke="#ffffff" stroke-width="1"/>`;
}
const poiTemplates = {
	default: {
		width: 40,
		height: 40,
		viewBox: "0 0 40 40",
		contentSlot: {x: 9, y: 9, size: 22},
		textAnchor: {x: 20, y: 26},
		fontSize: 18,
		renderBackground: (colors) =>
			renderSquareBackground(
				colors,
				4,
				{x: 7.5, y: 7.5, size: 25},
				false,
			),
	},
	small: {
		width: 28,
		height: 28,
		viewBox: "0 0 28 28",
		contentSlot: {x: 7.5, y: 7.5, size: 13},
		textAnchor: {x: 14, y: 18},
		fontSize: 11,
		renderBackground: (colors) =>
			renderCircleBackground(colors, 14, 14, 8.5),
	},
	xsmall: {
		width: 22,
		height: 22,
		viewBox: "0 0 22 22",
		contentSlot: {x: 6.5, y: 6.5, size: 9},
		textAnchor: {x: 11, y: 14.5},
		fontSize: 8,
		renderBackground: (colors) =>
			renderCircleBackground(colors, 11, 11, 6.5),
	},
	plain: {
		width: 34,
		height: 34,
		viewBox: "0 0 34 34",
		contentSlot: {x: 7, y: 7, size: 20},
		textAnchor: {x: 17, y: 22},
		fontSize: 14,
		renderBackground: (colors) =>
			renderSquareBackground(colors, 3, {x: 5.5, y: 5.5, size: 23}, true),
	},
};
export function getTemplate(variant) {
	const definition = poiTemplates[variant];
	if (!definition) {
		throw new Error(`Unknown icon variant: ${variant}`);
	}
	return definition;
}
//# sourceMappingURL=templates.js.map
