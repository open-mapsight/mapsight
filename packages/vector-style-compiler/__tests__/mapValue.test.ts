import {expect, it} from "vitest";

import mapValue from "../src/js/cssToRules/mapValue.ts";

it("mapValue", () => {
	expect(mapValue(1)).toStrictEqual({
		__meta: {
			stylePropExpressions: [],
			styleProps: [],
		},
		value: 1,
	});
	expect(mapValue("rgba(0,0, 0, 0.4)")).toStrictEqual({
		__meta: {
			stylePropExpressions: [],
			styleProps: [],
		},
		value: "'rgba(0,0, 0, 0.4)'",
	});
	expect(mapValue("attr(--env-test)")).toStrictEqual({
		__meta: {
			stylePropExpressions: [],
			styleProps: [],
		},
		value: "'' + env['test'] + ''",
	});
	expect(mapValue("attr(path-to-test)")).toStrictEqual({
		__meta: {
			stylePropExpressions: ["get(props, ['path', 'to', 'test'])"],
			styleProps: ["path"],
		},
		value: "'' + get(props, ['path', 'to', 'test']) + ''",
	});
	expect(mapValue("calc(10 + 50)")).toStrictEqual({
		__meta: {
			stylePropExpressions: [],
			styleProps: [],
		},
		value: "'' + (10 + 50) + ''",
	});
	expect(mapValue("calc(attr(test) + attr(--env-to-test))")).toStrictEqual({
		__meta: {
			stylePropExpressions: ["props['test']"],
			styleProps: ["test"],
		},
		value: "'' + (props['test'] + get(env, ['to', 'test'])) + ''",
	});
	expect(
		mapValue('calc(mapsightRuntimeIcon(attr(mapsightIconId), "default"))'),
	).toStrictEqual({
		__meta: {
			stylePropExpressions: ["props['mapsightIconId']"],
			styleProps: ["mapsightIconId"],
		},
		value: "'' + (mapsightRuntimeIcon(props['mapsightIconId'], \"default\")) + ''",
	});
});
