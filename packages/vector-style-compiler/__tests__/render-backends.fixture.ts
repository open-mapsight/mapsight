// @ts-expect-error Vite handles CSS imports for the browser fixture.
import "ol/ol.css";

import Feature from "ol/Feature.js";
import Map from "ol/Map.js";
import View from "ol/View.js";
import type Geometry from "ol/geom/Geometry.js";
import LineString from "ol/geom/LineString.js";
import Point from "ol/geom/Point.js";
import Polygon from "ol/geom/Polygon.js";
import VectorLayer from "ol/layer/Vector.js";
import WebGLVectorLayer from "ol/layer/WebGLVector.js";
import VectorSource from "ol/source/Vector.js";
import CircleStyle from "ol/style/Circle.js";
import Fill from "ol/style/Fill.js";
import Stroke from "ol/style/Stroke.js";
import Style from "ol/style/Style.js";
import type {FlatStyleLike} from "ol/style/flat.js";

import createCachedStyleFunction, {
	type StyleFunctionMetrics,
} from "../../lib-ol/src/js/style/createCachedStyleFunction.ts";

type Backend = "vsc-canvas" | "ol-canvas-flat" | "ol-webgl-flat";
type Scenario = "points" | "mixed";
type Workload = "hover" | "mutate" | "view" | "zoom";

type BenchOptions = {
	backend: Backend;
	featureCount: number;
	scenario: Scenario;
	updates: number;
	viewportHeight: number;
	viewportWidth: number;
	workload: Workload;
};

type BenchResult = {
	backend: Backend;
	featureCount: number;
	frameP95Ms: number;
	frames: number;
	initialRenderMs: number;
	scenario: Scenario;
	updateRenderMs: number;
	vscMetrics?: {
		declarationMs: number;
		level1Hits: number;
		level1Misses: number;
		level2Hits: number;
		level2Misses: number;
		materializationMs: number;
		totalMs: number;
	};
};

type BenchFeatureProps = {
	category: "incident" | "parking" | "poi" | "traffic";
	state: "default" | "highlight" | "select";
	weight: number;
};

const TARGET_ID = "map";
const INITIAL_ZOOM = 13;
const POINT_SPACING = 18;
const VIEW_CENTER: [number, number] = [0, 0];
const VIEW_RESOLUTIONS = Array.from(
	{length: 20},
	(_, i) => 156543.03392804097 / 2 ** i,
);

let currentZoom = INITIAL_ZOOM;

function ensureTarget(): HTMLElement {
	let target = document.getElementById(TARGET_ID);

	if (!target) {
		target = document.createElement("div");
		target.id = TARGET_ID;
		document.body.append(target);
	}

	return target;
}

function createSeededRandom(seed: number): () => number {
	let state = seed >>> 0;

	return () => {
		state = (1664525 * state + 1013904223) >>> 0;
		return state / 0x100000000;
	};
}

function createFeature(
	index: number,
	scenario: Scenario,
	random: () => number,
): Feature {
	const side = Math.ceil(Math.sqrt(index + 1));
	const x = (index % side) * POINT_SPACING;
	const y = Math.floor(index / side) * POINT_SPACING;
	const category = (["incident", "parking", "poi", "traffic"] as const)[
		index % 4
	]!;
	const state =
		random() > 0.96 ? "select" : random() > 0.84 ? "highlight" : "default";
	const weight = Math.floor(random() * 100);

	const geometry =
		scenario === "mixed" && index % 5 === 0
			? new Polygon([
					[
						[x, y],
						[x + 9, y],
						[x + 9, y + 9],
						[x, y + 9],
						[x, y],
					],
				])
			: scenario === "mixed" && index % 3 === 0
				? new LineString([
						[x, y],
						[x + 12, y + 8],
						[x + 24, y],
					])
				: new Point([x, y]);

	const feature = new Feature<Geometry>(geometry);
	feature.setProperties({category, state, weight});

	return feature;
}

function createFeatures(featureCount: number, scenario: Scenario): Feature[] {
	const random = createSeededRandom(20260616 + featureCount);

	return Array.from({length: featureCount}, (_, index) =>
		createFeature(index, scenario, random),
	);
}

function colorForCategory(category: BenchFeatureProps["category"]): string {
	switch (category) {
		case "incident":
			return "#d73027";
		case "parking":
			return "#4575b4";
		case "poi":
			return "#1a9850";
		case "traffic":
			return "#fdae61";
	}
}

function radiusForWeight(weight: number): number {
	return 3 + Math.round(weight / 18);
}

function strokeWidthForState(state: BenchFeatureProps["state"]): number {
	return state === "select" ? 3 : state === "highlight" ? 2 : 1;
}

function zIndexForState(state: BenchFeatureProps["state"]): number {
	return state === "select" ? 200 : state === "highlight" ? 20 : 1;
}

function createFlatRules(): FlatStyleLike {
	const baseStyle = {
		"circle-fill-color": [
			"match",
			["get", "category"],
			"incident",
			"#d73027",
			"parking",
			"#4575b4",
			"poi",
			"#1a9850",
			"#fdae61",
		],
		"circle-radius": ["+", 3, ["/", ["get", "weight"], 18]],
		"circle-stroke-color": "#ffffff",
		"circle-stroke-width": 1,
		"fill-color": [
			"match",
			["get", "category"],
			"incident",
			"rgba(215,48,39,0.35)",
			"parking",
			"rgba(69,117,180,0.35)",
			"poi",
			"rgba(26,152,80,0.35)",
			"rgba(253,174,97,0.35)",
		],
		"stroke-color": [
			"match",
			["get", "category"],
			"incident",
			"#d73027",
			"parking",
			"#4575b4",
			"poi",
			"#1a9850",
			"#fdae61",
		],
		"stroke-width": 1,
		"z-index": 1,
	};

	return [
		{
			filter: ["==", ["get", "state"], "select"],
			style: {
				...baseStyle,
				"circle-stroke-width": 3,
				"stroke-width": 3,
				"z-index": 200,
			},
		},
		{
			filter: ["==", ["get", "state"], "highlight"],
			style: {
				...baseStyle,
				"circle-stroke-width": 2,
				"stroke-width": 2,
				"z-index": 20,
			},
		},
		{
			else: true,
			style: baseStyle,
		},
	];
}

function createVscStyleFunction(
	metrics: Array<StyleFunctionMetrics>,
): ReturnType<typeof createCachedStyleFunction> {
	return createCachedStyleFunction({
		allowedProps: ["category", "state", "weight"],
		constructorsMap: {
			circle: CircleStyle,
			fill: Fill,
			stroke: Stroke,
			style: Style,
		},
		declarationHashFunction: (_env, props, envHash, geometryType) => {
			const category = props.category as BenchFeatureProps["category"];
			const state = props.state as BenchFeatureProps["state"];

			return [
				envHash,
				geometryType,
				category,
				state,
				Math.floor(Number(props.weight) / 18),
			].join("|");
		},
		declarationFunction: (_env, props) => {
			const category = props.category as BenchFeatureProps["category"];
			const state = props.state as BenchFeatureProps["state"];
			const weight = Number(props.weight);
			const color = colorForCategory(category);
			const strokeWidth = strokeWidthForState(state);

			return {
				default: {
					circle: {
						fill: {color: {value: color}},
						radius: {value: radiusForWeight(weight)},
						stroke: {
							color: {value: "#ffffff"},
							width: {value: strokeWidth},
						},
					},
					fill: {color: {value: color}},
					image: {type: {value: "circle"}},
					stroke: {
						color: {value: color},
						width: {value: strokeWidth},
					},
					zIndex: {value: zIndexForState(state)},
				},
			};
		},
		metricsCollector: (metric) => metrics.push(metric),
	});
}

function createLayer(
	backend: Backend,
	source: VectorSource,
	metrics: Array<StyleFunctionMetrics>,
): VectorLayer<VectorSource> | WebGLVectorLayer<VectorSource> {
	if (backend === "vsc-canvas") {
		const mapsightStyleFunction = createVscStyleFunction(metrics);

		return new VectorLayer({
			source,
			style: (feature) =>
				mapsightStyleFunction(
					{style: "default", zoom: currentZoom},
					feature,
				),
		});
	}

	if (backend === "ol-webgl-flat") {
		return new WebGLVectorLayer({
			disableHitDetection: true,
			source,
			style: createFlatRules(),
		});
	}

	return new VectorLayer({
		source,
		style: createFlatRules(),
	});
}

function waitForRenderComplete(map: Map): Promise<void> {
	return new Promise((resolve) => {
		map.once("rendercomplete", () => resolve());
		map.render();
	});
}

function nextFrame(): Promise<number> {
	return new Promise((resolve) => {
		requestAnimationFrame(resolve);
	});
}

async function measureFrames<T>(work: Promise<T>): Promise<{
	frameP95Ms: number;
	frames: number;
	result: T;
}> {
	const deltas: number[] = [];
	let running = true;
	let previous = await nextFrame();

	const collect = async () => {
		while (running) {
			const now = await nextFrame();
			deltas.push(now - previous);
			previous = now;
		}
	};

	const collector = collect();
	const result = await work;
	running = false;
	await collector;

	const sorted = [...deltas].sort((a, b) => a - b);
	const p95Index = Math.max(0, Math.floor(sorted.length * 0.95) - 1);

	return {
		frameP95Ms: sorted[p95Index] ?? 0,
		frames: sorted.length,
		result,
	};
}

function mutateFeatures(features: Feature[], iteration: number): void {
	for (let i = iteration; i < features.length; i += 17) {
		const feature = features[i]!;
		const state = feature.get("state") as BenchFeatureProps["state"];
		feature.set(
			"state",
			state === "default" ? "highlight" : "default",
			true,
		);
		feature.set("weight", (Number(feature.get("weight")) + 13) % 100, true);
		feature.changed();
	}
}

function hoverFeature(features: Feature[], iteration: number): void {
	const previousFeature =
		features[(iteration - 1 + features.length) % features.length]!;
	const currentFeature = features[iteration % features.length]!;

	previousFeature.set("state", "default", true);
	previousFeature.changed();
	currentFeature.set("state", "highlight", true);
	currentFeature.changed();
}

function summarizeVscMetrics(metrics: Array<StyleFunctionMetrics>) {
	if (metrics.length === 0) {
		return undefined;
	}

	return metrics.reduce(
		(total, metric) => ({
			declarationMs: total.declarationMs + metric.declarationMs,
			level1Hits: total.level1Hits + metric.level1Hits,
			level1Misses: total.level1Misses + metric.level1Misses,
			level2Hits: total.level2Hits + metric.level2Hits,
			level2Misses: total.level2Misses + metric.level2Misses,
			materializationMs:
				total.materializationMs + metric.styleMaterializationMs,
			totalMs: total.totalMs + metric.totalMs,
		}),
		{
			declarationMs: 0,
			level1Hits: 0,
			level1Misses: 0,
			level2Hits: 0,
			level2Misses: 0,
			materializationMs: 0,
			totalMs: 0,
		},
	);
}

async function runRenderBench(options: BenchOptions): Promise<BenchResult> {
	const target = ensureTarget();
	target.replaceChildren();
	target.style.height = `${options.viewportHeight}px`;
	target.style.width = `${options.viewportWidth}px`;
	currentZoom = INITIAL_ZOOM;

	const features = createFeatures(options.featureCount, options.scenario);
	const source = new VectorSource({features});
	const metrics: Array<StyleFunctionMetrics> = [];
	const layer = createLayer(options.backend, source, metrics);
	const view = new View({
		center: VIEW_CENTER,
		zoom: INITIAL_ZOOM,
		resolutions: VIEW_RESOLUTIONS,
	});
	const map = new Map({
		layers: [layer],
		target,
		view,
	});

	try {
		const initialStartedAt = performance.now();
		await waitForRenderComplete(map);
		const initialRenderMs = performance.now() - initialStartedAt;

		const {
			frameP95Ms,
			frames,
			result: updateRenderMs,
		} = await measureFrames(
			(async () => {
				const updateStartedAt = performance.now();

				for (
					let iteration = 0;
					iteration < options.updates;
					iteration++
				) {
					if (
						options.workload === "view" ||
						options.workload === "mutate"
					) {
						currentZoom = INITIAL_ZOOM + (iteration % 4);
						view.setZoom(currentZoom);
						view.setCenter([
							iteration * POINT_SPACING,
							iteration * POINT_SPACING,
						]);
					}

					if (options.workload === "zoom") {
						currentZoom = INITIAL_ZOOM + (iteration % 4);
						view.setZoom(currentZoom);
					}

					if (options.workload === "mutate") {
						mutateFeatures(features, iteration);
					}

					if (options.workload === "hover") {
						hoverFeature(features, iteration);
					}

					layer.changed();
					await waitForRenderComplete(map);
				}

				return performance.now() - updateStartedAt;
			})(),
		);

		return {
			backend: options.backend,
			featureCount: options.featureCount,
			frameP95Ms,
			frames,
			initialRenderMs,
			scenario: options.scenario,
			updateRenderMs,
			vscMetrics: summarizeVscMetrics(metrics),
		};
	} finally {
		map.setTarget(undefined);
		source.clear(true);
		layer.dispose();
	}
}

declare global {
	interface Window {
		__runRenderBench: typeof runRenderBench;
	}
}

window.__runRenderBench = runRenderBench;
