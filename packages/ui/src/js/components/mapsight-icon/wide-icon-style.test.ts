import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import CircleStyle from "ol/style/Circle";
import Icon from "ol/style/Icon";
import type Style from "ol/style/Style";

import {mapsightRuntimeIconSize} from "@mapsight/traffic-style/runtime";
import {afterEach, expect, it, vi} from "vitest";

// Exercise the actual SCSS -> compiler -> lib-ol -> OL path from the package build.
import styleFunction from "../../../../../traffic-style/dist/default.js";
import {defaultIconCache} from "../../../../../traffic-style/dist/lib/runtime/cache.js";

const src =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZkAAAAASUVORK5CYII=";

afterEach(() => vi.restoreAllMocks());

it.each([
	[14, undefined, 128, 80],
	[12, undefined, 82, 56],
	[10, undefined, 62, 44],
	[10, "highlight", 128, 80],
	[10, "select", 128, 80],
] as const)(
	"uses one centered full-width OL icon at zoom %s / %s",
	(zoom, state, width, height) => {
		vi.spyOn(defaultIconCache, "getCached").mockImplementation(
			(id, variant) => ({
				dataUrl: src,
				width: mapsightRuntimeIconSize(id, variant, "width"),
				height: mapsightRuntimeIconSize(id, variant, "height"),
				logicalWidth: width / 2,
				logicalHeight: height / 2,
				pixelRatio: 2,
				key: `${id}|${variant}`,
			}),
		);
		const feature = new Feature({
			geometry: new Point([0, 0]),
			mapsightIconId: "wc-accessible/#ffffff/#0e2a4f",
			state,
		});
		const styles = styleFunction(
			{style: "features", zoom},
			feature,
		) as Style[];
		const icons = styles
			.map((style) => style.getImage())
			.filter((image): image is Icon => image instanceof Icon);
		expect(icons).toHaveLength(1);
		const icon = icons[0]!;
		expect(icon.getSize()).toEqual([width, height]);
		expect(icon.getOrigin()).toEqual([0, 0]);
		expect(icon.getAnchor()).toEqual([width / 2, height / 2]);
		expect(icon.getScale()).toBe(0.5);
		// OL's draw and declutter/hit instructions use this same full image rectangle.
		expect(
			icon.getSize()?.map((size) => size * icon.getScaleArray()[0]!),
		).toEqual([width / 2, height / 2]);
		if (state) {
			const halo = styles
				.map((style) => style.getImage())
				.find((image) => image instanceof CircleStyle) as CircleStyle;
			expect(halo.getRadius()).toBe(38);
			expect(halo.getSize()).toEqual([76, 76]);
		}
	},
);

it.each([
	[{}, {mapsightIconId: "wc-accessible"}, 128],
	[{mapsightIconId: "wc"}, {mapsightIconId: "wc-accessible"}, 80],
	[
		{mapsightIconId: "wc"},
		{mapsightIconId: "wc-accessible", mapsightIconUse: "force"},
		128,
	],
])(
	"uses matching source and dimensions for feature/env/force precedence",
	(props, env, width) => {
		vi.spyOn(defaultIconCache, "getCached").mockReturnValue({
			dataUrl: src,
			width,
			height: 80,
			logicalWidth: width / 2,
			logicalHeight: 40,
			pixelRatio: 2,
			key: "test",
		});
		const feature = new Feature({geometry: new Point([0, 0]), ...props});
		const styles = styleFunction(
			{style: "features", zoom: 14, ...env},
			feature,
		) as Style[];
		const icon = styles
			.map((style) => style.getImage())
			.find((image) => image instanceof Icon) as Icon;
		expect(icon.getSize()).toEqual([width, 80]);
		expect(icon.getAnchor()).toEqual([width / 2, 40]);
	},
);
