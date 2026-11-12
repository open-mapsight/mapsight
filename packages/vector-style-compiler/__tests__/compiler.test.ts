import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import type RegularShape from "ol/style/RegularShape";

import {describe, expect, it} from "vitest";

import compile from "../src/js/index.ts";
import {loadStyleModule} from "./helpers/loadStyleModule.ts";

it("loads an empty stylesheet as a callable style with no declarations", async () => {
	const style = await loadStyleModule(compile(""));
	expect(style({}, new Feature(new Point([0, 0])))).toEqual([]);
});

it("materializes nested declaration groups with the generated constructors", async () => {
	const style = await loadStyleModule(
		compile(`
		#features {
			stroke { color: red; width: 3; }
			}
		#features .label { text { text: "Station"; fill { color: blue; } }
		}
	`),
	);
	const styles = style({style: "features"}, new Feature(new Point([0, 0])));
	expect(styles).toHaveLength(2);
	expect(styles[0]?.getStroke()?.getColor()).toBe("red");
	expect(styles[0]?.getStroke()?.getWidth()).toBe(3);
	expect(styles[1]?.getText()?.getText()).toBe("Station");
	expect(styles[1]?.getText()?.getFill()?.getColor()).toBe("blue");
});

it.each(["circle", "regularShape"])(
	"loads nested paint constructors for %s without a separate root fill or stroke",
	async (kind) => {
		const style = await loadStyleModule(
			compile(`* {
			image-type: ${kind};
			${kind}-radius: 5;
			${kind}-points: 3;
			${kind}-fill-color: blue;
			${kind}-stroke-color: red;
		}`),
		);
		const [result] = style({}, new Feature(new Point([0, 0])));
		const image = result?.getImage() as RegularShape;
		expect(image.getFill()?.getColor()).toBe("blue");
		expect(image.getStroke()?.getColor()).toBe("red");
	},
);

it("updates cached styles when selector, attribute, or environment inputs change", async () => {
	const style = await loadStyleModule(
		compile(`
		#features {
			stroke-width: calc(1 * attr(width));
			stroke-color: attr(--env-color);
		}
		#features [closed] { stroke-width: 0; }
	`),
	);
	const feature = new Feature({geometry: new Point([0, 0]), width: 2});
	const env = {style: "features", color: "red"};
	expect(Number(style(env, feature)[0]?.getStroke()?.getWidth())).toBe(2);
	feature.set("width", 4);
	expect(Number(style(env, feature)[0]?.getStroke()?.getWidth())).toBe(4);
	env.color = "blue";
	expect(style(env, feature)[0]?.getStroke()?.getColor()).toBe("blue");
	feature.set("closed", true);
	expect(Number(style(env, feature)[0]?.getStroke()?.getWidth())).toBe(0);
	feature.unset("closed");
	expect(Number(style(env, feature)[0]?.getStroke()?.getWidth())).toBe(4);
});

it("loads the built-in path and replacement helpers used by expressions", async () => {
	const style = await loadStyleModule(
		compile(`
		* {
			text-text: replace("a", "e", attr(label-name));
			text-offsetX: calc(3 * attr(--env-scale-factor));
		}
	`),
	);
	const feature = new Feature({
		geometry: new Point([0, 0]),
		label: {name: "hallo"},
	});
	const [result] = style({scale: {factor: 2}}, feature);
	expect(result?.getText()?.getText()).toBe("hello");
	expect(result?.getText()?.getOffsetX()).toBe(6);
});

it.each(["*", ".group", "#style"])(
	"rejects unsupported negation of %s",
	(selector) => {
		expect(() =>
			compile(`:not(${selector}) { stroke-color: red; }`),
		).toThrow(/Cannot negate/);
	},
);

describe("generated module helpers", () => {
	const feature = () =>
		new Feature({geometry: new Point([0, 0]), path: {to: {value: "a"}}});

	it("does not import from @mapsight/lib-js", () => {
		const output = compile(`* {
			text-text: replace("a", "e", attr(path-to-value));
			stroke-width: calc(attr(path-to-width) + 1);
		}`);
		expect(output).not.toContain("@mapsight/lib-js");
	});

	it("resolves nested feature property paths without lib-js", async () => {
		const output = compile(`* { text-text: attr(path-to-value); }`);
		expect(output).toContain("const get =");
		expect(output).not.toContain("const replace =");
		const style = await loadStyleModule(output);
		const [result] = style({}, feature());
		expect(result?.getText()?.getText()).toBe("a");
		// Missing intermediate segments resolve to undefined without throwing.
		const [missing] = style({}, new Feature(new Point([0, 0])));
		expect(missing?.getText()?.getText()).toBe("undefined");
	});

	it("evaluates replace() without lib-js", async () => {
		const output = compile(`* { text-text: replace("a", "e", "hallo"); }`);
		expect(output).toContain("const replace =");
		expect(output).not.toContain("const get =");
		const style = await loadStyleModule(output);
		const [result] = style({}, feature());
		expect(result?.getText()?.getText()).toBe("hello");
	});

	it("emits no helpers for styles that use neither", () => {
		const output = compile(`* { stroke-width: 2; }`);
		expect(output).not.toContain("const get =");
		expect(output).not.toContain("const replace =");
	});
});
