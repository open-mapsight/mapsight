import {getPictogram} from "../pictograms/index.js";
import {resolveSpec} from "./resolve.js";
import {getTemplate} from "./templates.js";

const DEFAULT_PICTOGRAM_PADDING = 0.05;
const FONT_AWESOME_PICTOGRAM_PADDING = 0.1;
function parseViewBox(viewBox) {
	const parts = viewBox.split(/\s+/).map(Number);
	return {
		x: parts[0] ?? 0,
		y: parts[1] ?? 0,
		width: parts[2] ?? 0,
		height: parts[3] ?? 0,
	};
}
function pictogramPadding(pictogram) {
	return (
		pictogram.padding ??
		(pictogram.source === "fontawesome"
			? FONT_AWESOME_PICTOGRAM_PADDING
			: DEFAULT_PICTOGRAM_PADDING)
	);
}
function insetSlot(slot, padding) {
	const inset = slot.size * padding;
	return {
		x: slot.x + inset,
		y: slot.y + inset,
		size: slot.size - inset * 2,
	};
}
function renderPictogram(pictogram, slot, color) {
	const paddedSlot = insetSlot(slot, pictogramPadding(pictogram));
	const {x, y, width, height} = parseViewBox(pictogram.viewBox);
	if (width <= 0 || height <= 0) {
		return "";
	}
	const scale = Math.min(paddedSlot.size / width, paddedSlot.size / height);
	const scaledWidth = width * scale;
	const scaledHeight = height * scale;
	const translateX = paddedSlot.x + (paddedSlot.size - scaledWidth) / 2;
	const translateY = paddedSlot.y + (paddedSlot.size - scaledHeight) / 2;
	return `<g transform="translate(${translateX} ${translateY}) scale(${scale}) translate(${-x} ${-y})" color="${color}">${pictogram.markup}</g>`;
}
function renderLabel(label, anchor, fontSize, foreground, background) {
	const text = label.slice(0, 2).toUpperCase();
	const strokeWidth = Math.max(2, fontSize * 0.32);
	return `<text x="${anchor.x}" y="${anchor.y}" fill="${foreground}" stroke="${background}" stroke-width="${strokeWidth}" paint-order="stroke fill" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" text-anchor="middle">${text}</text>`;
}
export function composeSvg(spec) {
	const resolved = resolveSpec(spec);
	const template = getTemplate(resolved.variant);
	const hasPictogram = Boolean(resolved.pictogram);
	const hasLabel = Boolean(resolved.label?.trim());
	let inner = template.renderBackground(resolved.colors);
	if (hasPictogram && resolved.pictogram) {
		const pictogram = getPictogram(resolved.pictogram);
		inner += renderPictogram(
			pictogram,
			template.contentSlot,
			resolved.colors.foreground,
		);
	} else if (hasLabel && resolved.label) {
		inner += renderLabel(
			resolved.label,
			template.textAnchor,
			template.fontSize,
			resolved.colors.foreground,
			resolved.colors.background,
		);
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${template.width}" height="${template.height}" viewBox="${template.viewBox}"><g fill="none" fill-rule="evenodd">${inner}</g></svg>`;
}
//# sourceMappingURL=compose.js.map
