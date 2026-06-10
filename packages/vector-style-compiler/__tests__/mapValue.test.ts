import {expect, it} from "vitest";

import mapValue from "../src/js/cssToRules/mapValue.ts";

it("mapValue", () => {
	expect(mapValue(1)).toStrictEqual({
		__meta: {
			stylePropExpressions: [],
			styleProps: [],
			volatileCalcExpressions: [],
		},
		value: 1,
	});
	expect(mapValue("rgba(0,0, 0, 0.4)")).toStrictEqual({
		__meta: {
			stylePropExpressions: [],
			styleProps: [],
			volatileCalcExpressions: [],
		},
		value: "'rgba(0,0, 0, 0.4)'",
	});
	expect(mapValue("attr(--env-test)")).toStrictEqual({
		__meta: {
			stylePropExpressions: [],
			styleProps: [],
			volatileCalcExpressions: [],
		},
		value: "'' + env['test'] + ''",
	});
	expect(mapValue("attr(path-to-test)")).toStrictEqual({
		__meta: {
			stylePropExpressions: ["get(props, ['path', 'to', 'test'])"],
			styleProps: ["path"],
			volatileCalcExpressions: [],
		},
		value: "'' + get(props, ['path', 'to', 'test']) + ''",
	});
	expect(mapValue("calc(10 + 50)")).toStrictEqual({
		__meta: {
			stylePropExpressions: [],
			styleProps: [],
			volatileCalcExpressions: [],
		},
		value: "'' + (10 + 50) + ''",
	});
	expect(mapValue("calc(attr(test) + attr(--env-to-test))")).toStrictEqual({
		__meta: {
			stylePropExpressions: ["props['test']"],
			styleProps: ["test"],
			volatileCalcExpressions: [],
		},
		value: "'' + (props['test'] + get(env, ['to', 'test'])) + ''",
	});
	expect(
		mapValue('calc(mapsightRuntimeIcon(attr(mapsightIconId), "default"))'),
	).toStrictEqual({
		__meta: {
			stylePropExpressions: ["props['mapsightIconId']"],
			styleProps: ["mapsightIconId"],
			volatileCalcExpressions: [
				"mapsightRuntimeIcon(props['mapsightIconId'], \"default\")",
			],
		},
		value: "'' + (mapsightRuntimeIcon(props['mapsightIconId'], \"default\")) + ''",
	});
});
