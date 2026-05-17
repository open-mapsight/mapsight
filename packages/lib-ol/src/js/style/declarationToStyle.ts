import LRUCache from "ol/structs/LRUCache";
import type Image from "ol/style/Image";
import type Style from "ol/style/Style";

import type {
	BoolishStyleValue,
	NumberArrayStyleValue,
	RootStyleDeclaration,
	StyleDeclaration,
	StyleLiteral,
	StyleValues,
	UnitStyleValue,
} from "../index";

const IMAGE_TYPES = ["image", "icon", "circle"];
const NONE_ABLE_PROPS = ["fill", "stroke"];

const unitFromAnchorValue = (a?: string | null) =>
	a && typeof a === "string" && a.indexOf("px") > -1 ? "pixels" : "fraction";
const boolishValue = (a?: BoolishStyleValue) =>
	a === true || a === 1 || a === "1" || a === "true";
const numberValue = (a?: string | number | null) =>
	a ? parseFloat(String(a)) : 0;
const intValue = (a?: string | number | null) =>
	a ? parseInt(String(a), 10) : 0;
const numberArrayValue = (a?: NumberArrayStyleValue) => {
	let arr: Array<string | number> = [];
	if (a) {
		if (Array.isArray(a)) {
			arr = a;
		}

		if (typeof a === "string") {
			arr = a.split(",");
		}
	}

	return arr.map((b) => parseFloat(String(b).trim()));
};

const HASH_STRING_DELIMITER = "|";
export const DEFAULT_CACHE_SIZE = 100;

let defaultCache: null | LRUCache<Style | null> = null;

function getDefaultCache() {
	if (defaultCache === null) {
		defaultCache = new LRUCache(DEFAULT_CACHE_SIZE);
	}
	return defaultCache;
}

function _declarationToStyle(
	constructorsMap: Record<string, unknown>,
	declaration: Readonly<RootStyleDeclaration | StyleDeclaration>,
	type: string,
	cache: LRUCache<Style | null>,
	root = true,
): Style | null {
	const style: StyleLiteral = {};

	if (root) {
		const rootDeclaration = declaration as Readonly<RootStyleDeclaration>;

		if (rootDeclaration.display?.value === "none") {
			return null;
		}

		// image is the base for icon, circle and regular shape. image only has image-type: *; any other options
		// will be in either of the above. e.g. icon-src: ...;
		if (rootDeclaration.image) {
			const imageType = rootDeclaration.image.type.value;
			if (imageType) {
				if (rootDeclaration[imageType]) {
					// FIXME: converting `Style` to `Image`
					style.image = declarationToStyle(
						constructorsMap,
						rootDeclaration[
							imageType
						] as Readonly<StyleDeclaration>,
						imageType,
						undefined,
						cache,
						false,
					) as Image | null;
				}
			} else {
				console.error("Image type unknown", imageType, rootDeclaration);
			}
		}
	}

	Object.keys(declaration).forEach((key) => {
		if (IMAGE_TYPES.indexOf(key) > -1) {
			return;
		}

		const values = declaration as Readonly<StyleValues>;
		const declarationValue = values[key];
		if (typeof declarationValue !== "object") {
			return;
		}

		const declarationValueValue =
			"value" in declarationValue ? declarationValue.value : undefined;

		if (declarationValueValue === undefined) {
			if (key in constructorsMap) {
				try {
					style[key] = declarationToStyle(
						constructorsMap,
						declarationValue as Readonly<StyleDeclaration>,
						key,
						undefined,
						cache,
						false,
					);
				} catch (e) {
					console.error("Style error", e);
				}
			}

			return;
		}

		if (
			declarationValueValue === "unset" ||
			(declarationValueValue === "none" &&
				NONE_ABLE_PROPS.indexOf(key) > -1)
		) {
			delete style[key];
			return;
		}

		switch (key) {
			// booleans
			case "snapToPixel":
				style.snapToPixel = boolishValue(
					declarationValueValue as BoolishStyleValue,
				);
				break;

			case "rotateWithView":
				style.rotateWithView = boolishValue(
					declarationValueValue as BoolishStyleValue,
				);
				break;

			// allow space separated double value (x and y)
			//case 'size':
			//	style.size = declarationValueValue ? declarationValueValue.split(' ').map(part => parseFloat(part)) : style.size;
			//	break;

			case "sizeX":
				style.size = style.size || [0, 0];
				style.size[0] = numberValue(declarationValueValue);
				break;

			case "sizeY":
				style.size = style.size || [0, 0];
				style.size[1] = numberValue(declarationValueValue);
				break;

			// allow space separated double value (x and y)
			//case 'imgSize':
			//	style.imgSize = declarationValueValue ? declarationValueValue.split(' ').map(part => parseFloat(part)) : style.imgSize;
			//	break;

			case "imgSizeX":
				style.imgSize = style.imgSize || [0, 0];
				style.imgSize[0] = numberValue(declarationValueValue);
				break;

			case "imgSizeY":
				style.imgSize = style.imgSize || [0, 0];
				style.imgSize[1] = numberValue(declarationValueValue);
				break;

			case "anchorX":
				style.anchor = style.anchor || [0, 0];
				style.anchor[0] = numberValue(declarationValueValue);
				style.anchorXUnits = unitFromAnchorValue(
					declarationValueValue as UnitStyleValue,
				);
				break;

			case "anchorY":
				style.anchor = style.anchor || [0, 0];
				style.anchor[1] = numberValue(declarationValueValue);
				style.anchorYUnits = unitFromAnchorValue(
					declarationValueValue as UnitStyleValue,
				);
				break;

			// can be directly (offsetX in ol.style.Text or offset array in ol.style.Icon)
			case "offsetX":
				style.offset = style.offset || [0, 0];
				style.offsetX = style.offset[0] = numberValue(
					declarationValueValue,
				);
				break;

			// can be directly (offsetY in ol.style.Text or offset array in ol.style.Icon)
			case "offsetY":
				style.offset = style.offset || [0, 0];
				style.offsetY = style.offset[1] = numberValue(
					declarationValueValue,
				);
				break;

			case "colorRed":
				style.color = style.color || [0, 0, 0, 1];
				style.color[0] = intValue(declarationValueValue);
				break;

			case "colorGreen":
				style.color = style.color || [0, 0, 0, 1];
				style.color[1] = intValue(declarationValueValue);
				break;

			case "colorBlue":
				style.color = style.color || [0, 0, 0, 1];
				style.color[2] = intValue(declarationValueValue);
				break;

			case "colorAlpha":
				style.color = style.color || [0, 0, 0, 1];
				style.color[3] = numberValue(declarationValueValue);
				break;

			case "lineDash":
				style.lineDash = numberArrayValue(
					declarationValueValue as NumberArrayStyleValue,
				);
				break;

			default:
				style[key] = declarationValueValue;
		}
	});

	const StyleCtor = constructorsMap[type] as
		| (new (style: StyleLiteral) => Style)
		| undefined;
	return StyleCtor ? new StyleCtor(style) : null;
}

export default function declarationToStyle<StyleKey extends string = string>(
	constructorsMap: Record<StyleKey, unknown>,
	declaration: Readonly<RootStyleDeclaration | StyleDeclaration>,
	type: StyleKey,
	hash?: string,
	cache: LRUCache<Style | null> = getDefaultCache(),
	root = true,
): null | Style {
	if (!constructorsMap[type]) {
		console.error("Style unknown", type, declaration);
		return null;
	}

	const cacheHash =
		type + HASH_STRING_DELIMITER + (hash || JSON.stringify(declaration));
	if (!cache.containsKey(cacheHash)) {
		cache.set(
			cacheHash,
			_declarationToStyle(
				constructorsMap,
				declaration,
				type,
				cache,
				root,
			),
		);
	}

	return cache.get(cacheHash);
}
