import uniq from "lodash/uniq.js";

import {isTruthy} from "@mapsight/lib-js/boolean";

const IMPORT_PREFIX = "__vectorStyle_";

const OL_IMPORT_PATH_BY_NAME: Record<string, string> = {
	style: "ol/style/Style",
	image: "ol/style/Image",
	icon: "ol/style/Icon",
	circle: "ol/style/Circle",
	stroke: "ol/style/Stroke",
	text: "ol/style/Text",
	fill: "ol/style/Fill",
	regularShape: "ol/style/RegularShape",
};

export default function createModulesMapFromDependencies(
	declarationNames: Array<string>,
) {
	// These constructors can contain nested fill/stroke declarations that are not
	// listed separately in the compiler metadata (e.g. text-fill-color).
	if (
		declarationNames.some((name) =>
			["circle", "regularShape", "text"].includes(name),
		)
	) {
		declarationNames.push("stroke");
		declarationNames.push("fill");
	}

	const names = uniq(
		declarationNames
			.concat(["style"]) /* we always need at least ol.style.Style */
			.filter(isTruthy),
	).filter((name) => OL_IMPORT_PATH_BY_NAME[name]);

	// prettier-ignore
	return {
		imports: names.map(name => `import ${IMPORT_PREFIX}${name} from '${OL_IMPORT_PATH_BY_NAME[name]}';`).join('\n'),
		map: `{${names.map(name => `${name}: ${IMPORT_PREFIX}${name},`).join('\n')}}`,
	};
}
