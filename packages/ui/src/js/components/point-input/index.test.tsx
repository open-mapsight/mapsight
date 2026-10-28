import {Provider} from "react-redux";

import Feature from "ol/Feature";
import View from "ol/View";
import Point from "ol/geom/Point";
import type VectorLayer from "ol/layer/Vector";
import {clearUserProjection, fromLonLat, useGeographic} from "ol/proj";
import type VectorSource from "ol/source/Vector";

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type {Feature as GeoJsonFeature, Point as GeoJsonPoint} from "geojson";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setData} from "@mapsight/core/lib/feature-sources/actions";
import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";
import type {MapController} from "@mapsight/core/lib/map/controller";
import type Draw from "@mapsight/core/lib/map/lib/DrawInteraction";
import {getIdForLayer} from "@mapsight/core/lib/map/lib/tagLayer";
import EditorMixin from "@mapsight/core/mixins/EditorMixin";
import {di} from "@mapsight/core/ol-proxy";
import GeoJSONDefinition from "@mapsight/core/ol-proxy/definitions/format/GeoJSONFormat";
import DrawDefinition from "@mapsight/core/ol-proxy/definitions/interaction/DrawInteraction";
import KeyboardPanDefinition from "@mapsight/core/ol-proxy/definitions/interaction/KeyboardPanInteraction";
import ModifyDefinition from "@mapsight/core/ol-proxy/definitions/interaction/ModifyInteraction";
import TranslateDefinition from "@mapsight/core/ol-proxy/definitions/interaction/TranslateInteraction";
import VectorLayerDefinition from "@mapsight/core/ol-proxy/definitions/layer/VectorLayer";
import VectorOverlayLayerDefinition from "@mapsight/core/ol-proxy/definitions/layer/VectorOverlayLayer";
import VectorFeatureSourceDefinition from "@mapsight/core/ol-proxy/definitions/source/VectorFeatureSource";

import {setDocumentLanguage} from "../../helpers/i18n";
import {create} from "../../index";
import {configureReactModalAppElement} from "../../react-modal-app-element";
import PointInputControls from "./index";

const disposers: Array<() => void> = [];
afterEach(() => {
	vi.unstubAllGlobals();
	cleanup();
	disposers.splice(0).forEach((dispose) => dispose());
	clearUserProjection();
	setDocumentLanguage("de");
});

function setup(projection = "EPSG:4326") {
	di.injectDefinitions([
		DrawDefinition,
		ModifyDefinition,
		TranslateDefinition,
		KeyboardPanDefinition,
		VectorLayerDefinition,
		VectorOverlayLayerDefinition,
		VectorFeatureSourceDefinition,
		GeoJSONDefinition,
	]);
	const context = create(
		null,
		() => undefined,
		{
			map: {
				layers: {},
				interactions: {
					KeyboardPan: {
						type: "KeyboardPanInteraction",
						options: {duration: 0},
					},
				},
			},
		},
		{renderer: vi.fn(), validateConfig: false},
	);
	const store = context.store!;
	new EditorMixin(store, "pointInput", {
		projection,
		draw: {active: true, type: "Point", replacePrevious: true},
	});
	const map = (store.getController("map") as MapController).getMap()!;
	const target = document.createElement("div");
	target.tabIndex = 0;
	target.setAttribute("aria-describedby", "existing");
	document.body.append(target);
	map.setTarget(target);
	map.setSize([400, 400]);
	map.getView().setCenter(fromLonLat([10.52, 52.27]));
	map.getView().setZoom(13);
	map.renderSync();
	disposers.push(() => {
		map.dispose();
		target.remove();
	});
	const tree = (enabled = true) => (
		<Provider store={store}>
			<PointInputControls
				featureSourceId="pointInput_featureSource"
				featureProjection={projection}
				enabled={enabled}
			/>
		</Provider>
	);
	const features = (): Array<GeoJsonFeature<GeoJsonPoint>> | undefined =>
		(
			store.getState() as unknown as {
				featureSources: Record<string, FeatureSourceState>;
			}
		).featureSources.pointInput_featureSource?.data?.features as
			Array<GeoJsonFeature<GeoJsonPoint>> | undefined;
	return {store, map, target, tree, features};
}

describe("PointInputControls", () => {
	it("names the keyboard-help dialog and restores focus when it closes", async () => {
		const {tree} = setup();
		const {container} = render(tree());
		configureReactModalAppElement(container);
		const help = screen.getByRole("button", {name: "Tastaturhilfe"});
		help.focus();
		fireEvent.click(help);
		expect(
			screen.getByRole("dialog", {name: "Tastaturhilfe"}),
		).toBeTruthy();
		fireEvent.click(
			screen.getByRole("button", {name: "Tastaturhilfe schließen"}),
		);
		await waitFor(() => {
			expect(
				screen.queryByRole("dialog", {name: "Tastaturhilfe"}),
			).toBeNull();
			expect(document.activeElement).toBe(help);
		});
	});

	it("pans the focused OL map, then confirms a projected point through the editor source", () => {
		const {map, target, tree, features} = setup();
		render(tree());
		target.focus();
		const oldCenter = map.getView().getCenter()!.slice();
		fireEvent.keyDown(target, {key: "ArrowRight", keyCode: 39});
		expect(map.getView().getCenter()![0]).toBeGreaterThan(oldCenter[0]!);
		fireEvent.keyDown(target, {key: "Enter"});
		const point = features()![0]!;
		expect(point.geometry.type).toBe("Point");
		expect(point.geometry.coordinates[0]).toBeGreaterThan(10.52);
		expect(point.geometry.coordinates[1]).toBeCloseTo(52.27, 5);
		expect(screen.getByRole("status").textContent).toContain(
			"Position übernommen",
		);
		expect(target.classList.contains("ms3-map-target--point-input")).toBe(
			true,
		);
		expect(target.getAttribute("aria-describedby")).toContain("existing");
	});

	it("replaces a pointer-created point and reflects the result in OL as well as Redux", async () => {
		const {map, tree, features} = setup();
		const draw = map
			.getInteractions()
			.getArray()
			.find(
				(interaction) =>
					typeof (interaction as Draw).handleSketchEnd === "function",
			) as Draw;
		const pointer = new Feature(new Point(fromLonLat([10, 52])));
		pointer.setId("pointer-point");
		draw.handleSketchEnd({feature: pointer});
		await waitFor(() => expect(features()?.[0]?.id).toBe("pointer-point"));
		render(tree());
		fireEvent.click(
			screen.getByRole("button", {name: "Kartenmitte übernehmen"}),
		);
		expect(features()).toHaveLength(1);
		expect(features()![0]!.geometry.coordinates[0]).toBeCloseTo(10.52);
		const layer = map
			.getAllLayers()
			.find(
				(layer) => getIdForLayer(layer) === "pointInput_layer",
			) as VectorLayer<VectorSource>;
		map.renderSync();
		expect(layer.getSource()!.getFeatures()).toHaveLength(1);
		act(() => map.getView().setCenter(fromLonLat([11, 53])));
		fireEvent.click(
			screen.getByRole("button", {name: "Kartenmitte übernehmen"}),
		);
		expect(features()).toHaveLength(1);
		expect(features()![0]!.geometry.coordinates[1]).toBeCloseTo(53);
	});

	it("ignores other focus, nested widgets, modifiers, repeat and disabled state; cleans up on remount", () => {
		const {map, target, tree, features} = setup();
		const {rerender, unmount} = render(tree());
		target.focus();
		for (const props of [
			{ctrlKey: true},
			{repeat: true},
			{isComposing: true},
		])
			fireEvent.keyDown(target, {key: "Enter", ...props});
		const input = document.createElement("input");
		target.append(input);
		input.focus();
		fireEvent.keyDown(input, {key: "Enter"});
		expect(features() ?? []).toHaveLength(0);
		const next = document.createElement("div");
		next.tabIndex = 0;
		document.body.append(next);
		act(() => map.setTarget(next));
		target.focus();
		fireEvent.keyDown(target, {key: "Enter"});
		expect(features() ?? []).toHaveLength(0);
		next.focus();
		fireEvent.keyDown(next, {key: "Enter"});
		expect(features()).toHaveLength(1);
		expect(target.getAttribute("aria-describedby")).toBe("existing");
		rerender(tree(false));
		expect(next.classList.contains("ms3-map-target--point-input")).toBe(
			false,
		);
		expect(next.hasAttribute("aria-describedby")).toBe(false);
		unmount();
		next.remove();
	});

	it("aligns the crosshair and commits the view centre with padding, rotation and a geographic view", () => {
		const {map, target, tree, features} = setup();
		map.setView(
			new View({
				projection: "EPSG:4326",
				center: [9, 51],
				zoom: 13,
				padding: [0, 80, 0, 0],
				rotation: 0.5,
			}),
		);
		map.renderSync();
		render(tree());
		target.focus();
		const pixel = map.getPixelFromCoordinate(map.getView().getCenter()!);
		expect(target.style.getPropertyValue("--ms3-point-input-x")).toBe(
			`${pixel[0]}px`,
		);
		expect(pixel[0]).not.toBe(200);
		fireEvent.keyDown(target, {key: "Enter"});
		expect(features()![0]!.geometry.coordinates).toEqual([9, 51]);
	});

	it("uses the actual view projection and respects OL's user projection", () => {
		const {map, tree, features} = setup();
		useGeographic();
		act(() => map.getView().setCenter([9, 51]));
		setDocumentLanguage("en");
		render(tree());
		fireEvent.click(screen.getByRole("button", {name: "Use map centre"}));
		expect(features()![0]!.geometry.coordinates[0]).toBeCloseTo(9);
		expect(features()![0]!.geometry.coordinates[1]).toBeCloseTo(51);
	});
});

it.each(["EPSG:3857", "EPSG:4326"])(
	"round-trips point coordinates and collection metadata through the real source reader (%s)",
	(projection) => {
		const {map, store, tree, features} = setup(projection);
		const data = {
			type: "FeatureCollection" as const,
			crs: {type: "name", properties: {name: projection}},
			metadata: {editor: "host"},
			features: [],
		};
		store.dispatch(
			setData("featureSources", "pointInput_featureSource", data),
		);
		render(tree());
		fireEvent.click(
			screen.getByRole("button", {name: "Kartenmitte übernehmen"}),
		);
		const current = (
			store.getState() as unknown as {
				featureSources: Record<string, FeatureSourceState>;
			}
		).featureSources.pointInput_featureSource!.data!;
		expect(current).toMatchObject({crs: data.crs, metadata: data.metadata});
		const expected = fromLonLat([10.52, 52.27]);
		const layer = map
			.getAllLayers()
			.find(
				(layer) => getIdForLayer(layer) === "pointInput_layer",
			) as VectorLayer<VectorSource>;
		map.renderSync();
		const coordinates = (
			layer.getSource()!.getFeatures()[0]!.getGeometry() as Point
		).getCoordinates();
		expect(coordinates.every(Number.isFinite)).toBe(true);
		expect(coordinates[0]).toBeCloseTo(expected[0]!);
		expect(coordinates[1]).toBeCloseTo(expected[1]!);
		if (projection === "EPSG:3857")
			expect(features()![0]!.geometry.coordinates).toEqual(expected);
		else expect(features()![0]!.geometry.coordinates[0]).toBeCloseTo(10.52);
	},
);

it.each([undefined, "EPSG:4326"])(
	"writes a correct CRS for a non-geographic source with prior CRS %s",
	(priorCrs) => {
		const {map, store, tree} = setup("EPSG:3857");
		store.dispatch(
			setData("featureSources", "pointInput_featureSource", {
				type: "FeatureCollection",
				...(priorCrs
					? {crs: {type: "name", properties: {name: priorCrs}}}
					: {}),
				features: [],
			}),
		);
		render(tree());
		fireEvent.click(
			screen.getByRole("button", {name: "Kartenmitte übernehmen"}),
		);
		map.renderSync();
		const layer = map
			.getAllLayers()
			.find(
				(layer) => getIdForLayer(layer) === "pointInput_layer",
			) as VectorLayer<VectorSource>;
		const point = layer
			.getSource()!
			.getFeatures()[0]!
			.getGeometry() as Point;
		expect(point.getCoordinates()[0]).toBeCloseTo(
			map.getView().getCenter()![0]!,
		);
		expect(point.getCoordinates()[1]).toBeCloseTo(
			map.getView().getCenter()![1]!,
		);
	},
);
