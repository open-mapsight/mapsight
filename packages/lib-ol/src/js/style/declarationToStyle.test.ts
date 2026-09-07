import Fill from "ol/style/Fill";
import Icon from "ol/style/Icon";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";

import {expect, it} from "vitest";

import declarationToStyle from "./declarationToStyle.ts";

const constructorsMap = {
	fill: Fill,
	icon: Icon,
	stroke: Stroke,
	style: Style,
};

it("skips Icon construction when icon is none so fill styles still apply", () => {
	const style = declarationToStyle(
		constructorsMap,
		{
			image: {type: {value: "icon"}},
			icon: {value: "none"},
			fill: {color: {value: "rgba(0,127,0,0.3)"}},
			stroke: {color: {value: "darkgreen"}, width: {value: 2}},
		},
		"style",
		"icon-none-polygon",
	);

	expect(style).not.toBeNull();
	expect(style?.getImage()).toBeNull();
	expect(style?.getFill()?.getColor()).toBe("rgba(0,127,0,0.3)");
});

it("still constructs an Icon when src is a non-empty URL", () => {
	const src =
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZkAAAAASUVORK5CYII=";
	const style = declarationToStyle(
		constructorsMap,
		{
			image: {type: {value: "icon"}},
			icon: {src: {value: src}},
		},
		"style",
		"icon-with-src",
	);

	expect(style?.getImage()).toBeInstanceOf(Icon);
	expect((style?.getImage() as Icon).getSrc()).toBe(src);
});

it("skips Icon construction when icon-src is empty", () => {
	const style = declarationToStyle(
		constructorsMap,
		{
			image: {type: {value: "icon"}},
			icon: {src: {value: ""}},
			fill: {color: {value: "#007f00"}},
		},
		"style",
		"icon-empty-src",
	);

	expect(style?.getImage()).toBeNull();
	expect(style?.getFill()).not.toBeNull();
});
