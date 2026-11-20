import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Icon from "ol/style/Icon";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";

import {expect, it} from "vitest";

import declarationToStyle from "./declarationToStyle.ts";

const constructorsMap = {
	circle: CircleStyle,
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

it("skips Icon construction when icon is none even if a merged src remains", () => {
	const icon = Object.assign(
		{value: "none" as const},
		{
			src: {
				value: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZkAAAAASUVORK5CYII=",
			},
		},
	);
	const style = declarationToStyle(
		constructorsMap,
		{
			image: {type: {value: "icon"}},
			icon,
			fill: {color: {value: "rgba(0,127,0,0.3)"}},
		},
		"style",
		"icon-none-with-merged-src",
	);

	expect(style?.getImage()).toBeNull();
	expect(style?.getFill()).not.toBeNull();
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

it("passes computed circle radii as numbers to OpenLayers", () => {
	const style = declarationToStyle(
		constructorsMap,
		{
			image: {type: {value: "circle"}},
			circle: {radius: {value: "38"}, fill: {color: {value: "cyan"}}},
		},
		"style",
		"computed-radius",
	);
	const circle = style?.getImage() as CircleStyle;
	expect(circle.getRadius()).toBe(38);
	expect(circle.getSize()).toEqual([76, 76]);
});

it("raises transparent paint to minOpacity after applying opacity, keeping RGB", () => {
	const style = declarationToStyle(
		constructorsMap,
		{
			fill: {
				color: {value: "rgba(255,255,255,0)"},
				opacity: {value: 1},
				minOpacity: {value: 0.3},
			},
			stroke: {
				color: {value: "rgba(128,0,128,0.4)"},
				opacity: {value: 0.5},
				minOpacity: {value: "0.85"},
			},
		},
		"style",
		"min-opacity-transparent",
	);

	expect(style?.getFill()?.getColor()).toEqual([255, 255, 255, 0.3]);
	expect(style?.getStroke()?.getColor()).toEqual([128, 0, 128, 0.85]);
});

it("keeps paint alpha above minOpacity and ignores minOpacity without a color", () => {
	const style = declarationToStyle(
		constructorsMap,
		{
			fill: {
				color: {value: "rgba(0,0,255,0.6)"},
				minOpacity: {value: 0.3},
			},
			stroke: {width: {value: 2}, minOpacity: {value: 1}},
		},
		"style",
		"min-opacity-noop",
	);

	expect(style?.getFill()?.getColor()).toEqual([0, 0, 255, 0.6]);
	expect(style?.getStroke()?.getColor()).toBeNull();
});

it("adds widthOffset to the resolved stroke width", () => {
	const widened = declarationToStyle(
		constructorsMap,
		{
			stroke: {
				color: {value: "red"},
				width: {value: "3"},
				widthOffset: {value: 4},
			},
		},
		"style",
		"width-offset",
	);
	const defaulted = declarationToStyle(
		constructorsMap,
		{stroke: {color: {value: "red"}, widthOffset: {value: "2"}}},
		"style",
		"width-offset-default",
	);
	const clamped = declarationToStyle(
		constructorsMap,
		{
			stroke: {
				color: {value: "red"},
				width: {value: 1},
				widthOffset: {value: -3},
			},
		},
		"style",
		"width-offset-clamped",
	);

	expect(widened?.getStroke()?.getWidth()).toBe(7);
	expect(defaulted?.getStroke()?.getWidth()).toBe(3);
	expect(clamped?.getStroke()?.getWidth()).toBe(0);
});
