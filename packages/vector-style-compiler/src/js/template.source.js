import get from "@mapsight/lib-js/object/getPath";
import replace from "@mapsight/lib-js/string/replaceRegex";
import createCachedStyleFunction from "@mapsight/lib-ol/style/createCachedStyleFunction";
/* imports-start: */
import __vectorStyle_circle from "ol/style/Circle";

/* :imports-end */

/** @type {(value: unknown) => string} */
const createHash = /* @__PURE__ */ (value) =>
	/* @__PURE__ */ JSON.stringify(value);
/** @type {import('@mapsight/lib-ol/style/createCachedStyleFunction').StyleFunctionOptions} */
const styleOptions = {
	constructorsMap: /* constructorMap-start: */ {
		circle: __vectorStyle_circle,
	} /* :constructorMap-end */,
	allowedStyles: /* styleNames-start: */ [] /* :styleNames-end */,
	allowedProps: /* styleProps-start: */ ["test"] /* :styleProps-end */,
	volatileHashFunction: (env, props, geometryType, style) => {
		/** @type {Array<string|number>} */
		const parts = [];

		/* program0-start: */
		parts.push(geometryType);
		parts.push("@" + createHash(style));
		parts.push("@" + createHash(props["test"]));
		parts.push("@" + createHash(env["test"]));
		parts.push("@" + createHash(get(props, ["path", "to", "test"])));
		/* :program0-end */

		return createHash(parts);
	},
	declarationHashFunction: (env, props, hashPrefix, geometryType, style) => {
		/** @type {Array<string|number>} */
		const hash = [hashPrefix, geometryType];
		// noinspection UnnecessaryLocalVariableJS
		/** @type {(a: string|number) => void} */
		const h = (a) => {
			hash.push(a);
		};

		/* program1-start: */
		h(1);
		h("@" + createHash(style));
		h("@" + createHash(props["test"]));
		h("@" + createHash(env["test"]));
		h("@" + createHash(get(props, ["path", "to", "test"])));
		/* :program1-end */

		return hash.join("|");
	},
	declarationFunction: (env, props, geometryType, style) => {
		/** @type {Record<string, unknown>} */
		const d = {};

		/* program2-start: */
		d.zIndex = 1;
		d.calcTest = {value: "" + replace("a", "e", "hallo") + ""};
		d.a = env.a;
		d.b = props.b;
		d.geometryType = geometryType;
		d.style = style;
		d.test = "foo";
		/* :program2-end */

		return d;
	},
};

export default createCachedStyleFunction(styleOptions);
