import {Provider} from "react-redux";

import {fromLonLat} from "ol/proj";

import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setData} from "@mapsight/core/lib/feature-sources/actions";
import type {MapController} from "@mapsight/core/lib/map/controller";

import {setDocumentLanguage} from "../../helpers/i18n";
import {create} from "../../index";
import createSharePositionPlugin from "../../plugins/browser/share-position-link";
import createMeasureDistancePlugin, {
	getKeyboardDraw,
} from "../../plugins/common/measure-distance";
import MeasureDistanceButton from "./measure-distance-button";
import SharePositionLinkButton from "./share-position-link-button";

const disposers: Array<() => void> = [];
afterEach(() => {
	cleanup();
	disposers.splice(0).forEach((dispose) => dispose());
	setDocumentLanguage("de");
});

function setup(keyboardDrawing?: boolean) {
	const context = create(
		null,
		vi.fn(),
		{map: {layers: {}}},
		{
			renderer: vi.fn(),
			validateConfig: false,
			plugins: [
				["measure", createMeasureDistancePlugin({keyboardDrawing})],
				[
					"share",
					createSharePositionPlugin({
						keyboardDrawing,
						showMarker: false,
					}),
				],
			],
		},
	);
	const map = (
		context.store!.getController("map") as MapController
	).getMap()!;
	disposers.push(() => map.dispose());
	return {store: context.store!, map};
}

describe("keyboard tool controls", () => {
	it("shows Done only while measuring, enabled from two points, with a live labelled length", () => {
		const {store, map} = setup(true);
		render(
			<Provider store={store}>
				<MeasureDistanceButton opened />
			</Provider>,
		);
		const draw = getKeyboardDraw(map, "measureDistance")!;
		const finish = vi.spyOn(draw, "finishDrawing");
		const done = () => screen.queryByRole("button", {name: "Fertig"});
		expect(done()).toBeNull();
		act(() => draw.appendCoordinates([[0, 0]]));
		expect(done()!.getAttribute("aria-disabled")).toBe("true");
		fireEvent.click(done()!);
		expect(finish).not.toHaveBeenCalled();
		expect(screen.queryByText("Streckenlänge")).toBeNull();
		act(() => draw.appendCoordinates([[1000, 0]]));
		expect(done()!.hasAttribute("aria-disabled")).toBe(false);
		const output = screen.getByText("Streckenlänge").parentElement!;
		expect(output.textContent).toMatch(/Streckenlänge\s+998,88\sm/);
		// The output and Done come before the keyboard help.
		const help = screen.getByRole("button", {name: "Tastaturbedienung"});
		expect(
			output.compareDocumentPosition(help) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		fireEvent.click(done()!);
		expect(finish).toHaveBeenCalledTimes(1);
		expect(done()).toBeNull();
	});

	it("shares the map centre right away, then a marked place without selecting it", () => {
		const {store, map} = setup(true);
		map.getView().setCenter([0, 0]);
		render(
			<Provider store={store}>
				<SharePositionLinkButton opened />
			</Provider>,
		);
		const centre = screen.getByRole<HTMLInputElement>("textbox", {
			name: "Link zur Kartenmitte",
		});
		expect(centre.value).toMatch(/#lm=0\/0$/);
		act(() => {
			map.getView().setCenter(fromLonLat([10.5, 52.2]));
			map.dispatchEvent("moveend");
		});
		expect(centre.value).toMatch(/#lm=52\.2\/10\.5$/);
		// A pointer click writes a plain point; the plugin turns it into the marker.
		act(() => {
			store.dispatch(
				setData("featureSources", "sharePositionLink_featureSource", {
					type: "FeatureCollection",
					features: [
						{
							type: "Feature",
							geometry: {type: "Point", coordinates: [9, 51]},
							properties: {},
						},
					],
				}),
			);
		});
		const marked = screen.getByRole<HTMLInputElement>("textbox", {
			name: "Link zum markierten Ort",
		});
		expect(marked.value).toMatch(/#lm=51\/9$/);
		const selections = store.getState() as unknown as {
			featureSelections?: Record<string, {features?: unknown[]}>;
		};
		expect(selections.featureSelections?.select?.features ?? []).toEqual(
			[],
		);
		expect(getKeyboardDraw(map, "sharePositionLink")?.getActive()).toBe(
			true,
		);
		fireEvent.click(
			screen.getByRole("button", {name: "Markierung entfernen"}),
		);
		expect(
			screen.getByRole<HTMLInputElement>("textbox", {
				name: "Link zur Kartenmitte",
			}).value,
		).toMatch(/#lm=52\.2\/10\.5$/);
	});

	it("keeps the overlay text to one sentence and the key list collapsed", () => {
		const {store} = setup(true);
		const {container} = render(
			<Provider store={store}>
				<MeasureDistanceButton opened />
				<SharePositionLinkButton opened />
			</Provider>,
		);
		const texts = [
			...container.querySelectorAll(".ms3-tool-overlay__text"),
		].map((text) => text.textContent);
		expect(texts).toHaveLength(2);
		for (const text of texts) {
			expect(text).not.toMatch(/Rücktaste|Leertaste|Pfeiltasten/);
			expect(text.length).toBeLessThan(100);
		}
		const triggers = screen.getAllByRole("button", {
			name: "Tastaturbedienung",
		});
		expect(triggers).toHaveLength(2);
		for (const trigger of triggers) {
			expect(trigger.getAttribute("aria-expanded")).toBe("false");
			const panel = document.getElementById(
				trigger.getAttribute("aria-controls")!,
			)!;
			expect(panel.textContent).toContain("Rücktaste");
			expect(panel.checkVisibility?.() ?? !panel.hidden).toBe(false);
			fireEvent.click(trigger);
			expect(trigger.getAttribute("aria-expanded")).toBe("true");
			expect(panel.hidden).toBe(false);
		}
		// The link output comes before the keyboard help, which stays last.
		const link = screen.getByRole("textbox", {
			name: "Link zur Kartenmitte",
		});
		expect(
			link.compareDocumentPosition(triggers[1]!) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("links the open keyboard tool and the map in both directions without trapping focus", () => {
		const {store, map} = setup(true);
		const target = document.createElement("div");
		target.tabIndex = 0;
		document.body.append(target);
		disposers.push(() => target.remove());
		map.setTarget(target);
		const {rerender} = render(
			<Provider store={store}>
				<MeasureDistanceButton opened />
			</Provider>,
		);
		fireEvent.click(
			screen.getByRole("button", {name: "Zur Karte springen"}),
		);
		expect(document.activeElement).toBe(target);
		const slot = target.nextElementSibling!;
		expect(slot.className).toBe("ms3-map-return");
		fireEvent.click(
			screen.getByRole("button", {name: "Zurück zu „Strecke messen“"}),
		);
		expect(document.activeElement).toBe(
			screen.getByRole("region", {name: "Strecke messen"}),
		);
		rerender(
			<Provider store={store}>
				<MeasureDistanceButton opened={false} />
			</Provider>,
		);
		expect(slot.isConnected).toBe(false);
		expect(document.querySelector(".ms3-map-return")).toBeNull();
	});

	it("keeps keyboard drawing off by default on both plugins", () => {
		const {store, map} = setup();
		render(
			<Provider store={store}>
				<MeasureDistanceButton opened />
				<SharePositionLinkButton opened />
			</Provider>,
		);
		expect(getKeyboardDraw(map, "measureDistance")).toBeUndefined();
		expect(getKeyboardDraw(map, "sharePositionLink")).toBeUndefined();
		expect(screen.queryByRole("button", {name: "Fertig"})).toBeNull();
		expect(
			screen.queryByRole("button", {name: "Kartenmitte teilen"}),
		).toBeNull();
		expect(screen.queryByText(/Rücktaste/)).toBeNull();
		expect(
			screen.queryByRole("button", {name: "Zur Karte springen"}),
		).toBeNull();
	});
});
