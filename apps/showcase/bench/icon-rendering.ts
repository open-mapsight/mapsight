import Feature from "ol/Feature.js";
import OLMap from "ol/Map.js";
import View from "ol/View.js";
import Point from "ol/geom/Point.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Icon from "ol/style/Icon.js";
import Style from "ol/style/Style.js";

import {uiIconSrc} from "@mapsight/traffic-style/icon";
import {
	RUNTIME_ICON_PLACEHOLDER_SRC,
	defaultIconCache,
	mapsightRuntimeIcon,
	setRuntimeIconMapRenderCallback,
} from "@mapsight/traffic-style/runtime-dev";

import {
	type PreloadPlan,
	prepareIcons,
	prepareRuntimeIcon,
} from "./icon-preload.ts";

export type Mode = "sprite" | "png" | "svg" | "runtime";
export type Tile = {x: number; y: number; width: number; height: number};
export type Input = {
	mode: Mode;
	ids: string[];
	tiles: Record<string, Tile>;
	count: number;
	warm: boolean;
	frames: number;
	preload?: PreloadPlan;
};

export async function run(input: Input) {
	if (!input.warm) defaultIconCache.clear();
	const missesBefore = defaultIconCache.getStats().misses;
	performance.clearResourceTimings();
	const target = document.createElement("div");
	target.style.cssText = "position:absolute;inset:0";
	document.body.append(target);
	const columns = Math.ceil(
		Math.sqrt((input.count * innerWidth) / innerHeight),
	);
	const rows = Math.ceil(input.count / columns);
	const features = Array.from(
		{length: input.count},
		(_, index) =>
			new Feature({
				geometry: new Point([
					(((index % columns) - (columns - 1) / 2) * innerWidth) /
						(columns + 2),
					((Math.floor(index / columns) - (rows - 1) / 2) *
						innerHeight) /
						(rows + 2),
				]),
				icon: input.ids[index % input.ids.length],
			}),
	);
	const styles = new Map<string, Style>();
	const layer = new VectorLayer({
		source: new VectorSource({features}),
		style: (feature) => {
			const id = feature.get("icon") as string;
			let style = styles.get(id);
			if (!style) {
				const tile = input.tiles[id]!;
				const src =
					input.mode === "sprite"
						? "/sprite.png"
						: input.mode === "png"
							? `/png/${id}.png`
							: input.mode === "svg"
								? uiIconSrc(id, "default")!.src
								: mapsightRuntimeIcon(id, "default");
				style = new Style({
					image: new Icon({
						src,
						scale: input.mode === "svg" ? 1 : 0.5,
						...(input.mode === "sprite"
							? {
									offset: [tile.x + 4, tile.y + 4],
									size: [tile.width - 8, tile.height - 8],
								}
							: {}),
					}),
				});
				styles.set(id, style);
			}
			return style;
		},
	});
	const map = new OLMap({
		layers: [layer],
		view: new View({center: [0, 0], resolution: 1}),
		controls: [],
		interactions: [],
		pixelRatio: 2,
	});
	setRuntimeIconMapRenderCallback(() => {
		styles.clear();
		layer.changed();
		map.render();
	});
	const plan = input.preload;
	const intentAt = performance.now();
	const forecast =
		plan?.forecast === "wrong"
			? input.ids.map((id) => `${id}/#badbad`)
			: input.ids;
	const preparation = plan
		? prepareIcons(forecast, plan, (id) =>
				input.mode === "runtime"
					? prepareRuntimeIcon(id)
					: input.mode === "sprite"
						? "/sprite.png"
						: `/png/${id}.png`,
			)
		: undefined;
	const intentFrames: number[] = [];
	let lastIntentFrame: number | undefined;
	let navigationStarted = false;
	const probe = (time: number) => {
		if (navigationStarted) return;
		if (lastIntentFrame !== undefined)
			intentFrames.push(time - lastIntentFrame);
		lastIntentFrame = time;
		requestAnimationFrame(probe);
	};
	if (plan?.leadMs) {
		requestAnimationFrame(probe);
		await new Promise<void>((resolve) =>
			setTimeout(
				resolve,
				Math.max(0, intentAt + plan.leadMs - performance.now()),
			),
		);
	}
	navigationStarted = true;
	preparation?.stop(); // Commit takes priority; never start more speculative jobs after navigation.
	const start = performance.now();
	const readyAtNavigation = input.ids.filter((id) =>
		defaultIconCache.has(id, "default"),
	).length;
	const imagesReadyAtNavigation = plan
		? input.ids.filter((id) => {
				const src =
					input.mode === "runtime"
						? defaultIconCache.getCached(id, "default")?.dataUrl
						: input.mode === "sprite"
							? "/sprite.png"
							: `/png/${id}.png`;
				return (
					src !== undefined && new Icon({src}).getImageState() === 2
				);
			}).length
		: undefined;
	let firstIconsMs: number | undefined;
	let renderEvents = 0;
	const allIconsMs = await new Promise<number>((resolve, reject) => {
		const timeout = setTimeout(
			() => reject(new Error("Icons did not finish rendering")),
			20_000,
		);
		map.on("postrender", () => {
			renderEvents++;
			const loaded = [...styles.values()].filter((style) => {
				const image = style.getImage() as Icon;
				return (
					image.getImageState() === 2 &&
					image.getSrc() !== RUNTIME_ICON_PLACEHOLDER_SRC
				);
			}).length;
			if (loaded > 0) firstIconsMs ??= performance.now() - start;
			if (loaded === input.ids.length) {
				clearTimeout(timeout);
				resolve(performance.now() - start);
			}
		});
		map.setTarget(target);
	});
	const resources = performance.getEntriesByType(
		"resource",
	) as PerformanceResourceTiming[];
	const imageResources = resources.filter((resource) =>
		resource.name.endsWith(".png"),
	);
	const frameCosts: number[] = [];
	const frameIntervals: number[] = [];
	let previousFrame: number | undefined;
	for (let index = 0; index < input.frames; index++) {
		const frame = await new Promise<number>((resolve) =>
			requestAnimationFrame(resolve),
		);
		if (previousFrame !== undefined)
			frameIntervals.push(frame - previousFrame);
		previousFrame = frame;
		const before = performance.now();
		map.getView().setCenter([index % 7, index % 5]);
		map.renderSync();
		frameCosts.push(performance.now() - before);
	}
	// Validate a real draw after timing, without including canvas readback in frame cost.
	const canvas = target.querySelector("canvas")!;
	const pixels = canvas
		.getContext("2d")!
		.getImageData(0, 0, canvas.width, canvas.height).data;
	if (!pixels.some((value, index) => index % 4 === 3 && value > 0))
		throw new Error("Map canvas is empty");
	await preparation?.settled;
	map.setTarget(undefined);
	map.dispose();
	target.remove();
	setRuntimeIconMapRenderCallback(null);
	return {
		firstIconsMs,
		allIconsMs,
		renderEvents,
		frameCosts,
		frameIntervals,
		imageRequests: imageResources.length,
		imageBytes: imageResources.reduce(
			(sum, resource) => sum + resource.encodedBodySize,
			0,
		),
		protocols: [
			...new Set(
				imageResources.map((resource) => resource.nextHopProtocol),
			),
		],
		preloading: plan
			? {
					leadMs: start - intentAt,
					navigationDelayMs: Math.max(
						0,
						start - intentAt - plan.leadMs,
					),
					intentToAllIconsMs: start - intentAt + allIconsMs,
					readyAtNavigation,
					imagesReadyAtNavigation,
					started: preparation!.started.length,
					completed: preparation!.completed.length,
					unused: preparation!.completed.filter(
						(id) => !input.ids.includes(id),
					).length,
					peakActive: preparation!.peakActive,
					cacheMisses:
						defaultIconCache.getStats().misses - missesBefore,
					intentFrames,
				}
			: undefined,
	};
}
