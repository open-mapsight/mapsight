function hexToRgb(hex) {
	const normalized = hex.trim().replace(/^#/, "");
	if (normalized.length === 3) {
		return {
			r: Number.parseInt(normalized[0] + normalized[0], 16),
			g: Number.parseInt(normalized[1] + normalized[1], 16),
			b: Number.parseInt(normalized[2] + normalized[2], 16),
		};
	}
	if (normalized.length === 6) {
		return {
			r: Number.parseInt(normalized.slice(0, 2), 16),
			g: Number.parseInt(normalized.slice(2, 4), 16),
			b: Number.parseInt(normalized.slice(4, 6), 16),
		};
	}
	return null;
}
function srgbChannel(channel) {
	const value = channel / 255;
	return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
export function relativeLuminance(color) {
	const rgb = hexToRgb(color);
	if (!rgb) {
		return null;
	}
	return (
		0.2126 * srgbChannel(rgb.r) +
		0.7152 * srgbChannel(rgb.g) +
		0.0722 * srgbChannel(rgb.b)
	);
}
function contrastRatio(lighter, darker) {
	return (lighter + 0.05) / (darker + 0.05);
}
/** Pick #000 or #fff whichever contrasts better with the background. */
export function pickContrastForeground(background) {
	const backgroundLuminance = relativeLuminance(background);
	if (backgroundLuminance == null) {
		return "#000000";
	}
	const contrastWithBlack = contrastRatio(
		Math.max(backgroundLuminance, 0),
		Math.min(backgroundLuminance, 0),
	);
	const contrastWithWhite = contrastRatio(
		Math.max(backgroundLuminance, 1),
		Math.min(backgroundLuminance, 1),
	);
	return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#000000";
}
//# sourceMappingURL=contrast.js.map
