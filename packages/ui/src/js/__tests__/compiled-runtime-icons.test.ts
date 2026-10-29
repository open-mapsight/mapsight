// @vitest-environment node
import {fileURLToPath} from "node:url";

import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import type Icon from "ol/style/Icon";

import * as sass from "sass";
import {afterEach, expect, it, vi} from "vitest";

import {
	type IconBitmap,
	defaultIconCache,
} from "../../../../traffic-style/dist/lib/runtime/cache.js";
import {loadStyleModule} from "../../../../vector-style-compiler/__tests__/helpers/loadStyleModule.ts";
import compile from "../../../../vector-style-compiler/dist/index.js";

const runtimeDirectory = new URL("../../../", import.meta.url);
const loadPaths = [
	fileURLToPath(new URL("../traffic-style/src/scss/", runtimeDirectory)),
];
const bitmap = (id: string): IconBitmap => ({
	dataUrl: `https://example.test/${id}.png`,
	width: 40,
	height: 40,
	logicalWidth: 40,
	logicalHeight: 40,
	pixelRatio: 1,
	key: id,
});

afterEach(() => vi.restoreAllMocks());

it.each(["runtimeIcon", "runtimeIconSrc"])(
	"loads the real %s mixin and gives feature icons priority unless forced",
	async (mixin) => {
		// Only bitmap availability is controlled; Sass, emitted imports, helper and OL runtime are real.
		vi.spyOn(defaultIconCache, "getCached").mockImplementation((id) =>
			bitmap(id),
		);
		const style = await loadStyleModule(
			compile(
				sass.compileString(
					`
		@use "mixins/runtime-icon";
		#features { image-type: icon; @include runtime-icon.${mixin}(); }
	`,
					{loadPaths},
				).css,
			),
			runtimeDirectory,
		);
		const feature = new Feature({
			geometry: new Point([0, 0]),
			mapsightIconId: "museum",
		});
		const env = {style: "features", mapsightIconId: "school"};
		const source = () =>
			(style(env, feature)[0]?.getImage() as Icon).getSrc();
		expect(source()).toBe(bitmap("museum").dataUrl);
		feature.unset("mapsightIconId");
		expect(source()).toBe(bitmap("school").dataUrl);
		feature.set("mapsightIconId", "museum");
		expect(source()).toBe(bitmap("museum").dataUrl);
		expect(
			(
				style(
					{...env, mapsightIconUse: "force"},
					feature,
				)[0]?.getImage() as Icon
			).getSrc(),
		).toBe(bitmap("school").dataUrl);
	},
);

it.each([true, false])(
	"applies the real sprite and fallback selectors with force enabled=%s",
	async (force) => {
		const style = await loadStyleModule(
			compile(
				sass.compileString(
					`
		@use "variables" with ($MAPSIGHT_TRAFFIC_STYLE__ICON_ENABLE_FORCE_BY_ENV: ${force});
		@use "mixins/auto-icon";
		#features {
			image-type: icon;
			@include auto-icon.autoIcon($icons: (
				"museum-default": (x: 10, y: 0, width: 20, height: 20),
				"school-default": (x: 30, y: 0, width: 20, height: 20)
			), $iconFallbackMap: (school: ("unknown")));
		}
	`,
					{loadPaths},
				).css,
			),
			runtimeDirectory,
		);
		const feature = new Feature({
			geometry: new Point([0, 0]),
			mapsightIconId: "museum",
		});
		const env = {
			style: "features",
			imagesUrl: "/assets/",
			mapsightIconId: "school",
		};
		const offset = (current: Parameters<typeof style>[0] = env) =>
			(style(current, feature)[0]?.getImage() as Icon).getOrigin();
		expect(offset()).toEqual([10, 0]);
		expect(offset({...env, mapsightIconUse: "force"})).toEqual(
			force ? [30, 0] : [10, 0],
		);
		feature.unset("mapsightIconId");
		expect(offset()).toEqual([30, 0]);
		feature.set("mapsightIconId", "unknown");
		expect(offset()).toEqual([30, 0]);
	},
);

it("invalidates a compiled cached style when its runtime icon becomes available", async () => {
	const state: {cached?: IconBitmap} = {};
	vi.spyOn(defaultIconCache, "getCached").mockImplementation(
		() => state.cached,
	);
	let resolve!: (value: IconBitmap) => void;
	const pending = new Promise<IconBitmap>((done) => {
		resolve = done;
	});
	vi.spyOn(defaultIconCache, "get").mockReturnValue(pending);
	const style = await loadStyleModule(
		compile(
			sass.compileString(
				`
		@use "mixins/runtime-icon";
		#features { image-type: icon; @include runtime-icon.runtimeIcon(); }
	`,
				{loadPaths},
			).css,
		),
		runtimeDirectory,
	);
	const feature = new Feature({
		geometry: new Point([0, 0]),
		mapsightIconId: "museum",
	});
	const env = {style: "features"};
	const first = (style(env, feature)[0]?.getImage() as Icon).getSrc();
	expect(first).not.toBe(bitmap("museum").dataUrl);
	state.cached = bitmap("museum");
	resolve(state.cached);
	await pending;
	expect((style(env, feature)[0]?.getImage() as Icon).getSrc()).toBe(
		bitmap("museum").dataUrl,
	);
});
