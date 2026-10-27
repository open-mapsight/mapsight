import {Provider} from "react-redux";

import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

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

function setup(keyboardDrawing = true) {
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
	it("finishes the current measurement from the visible Done button", () => {
		const {store, map} = setup();
		render(
			<Provider store={store}>
				<MeasureDistanceButton opened />
			</Provider>,
		);
		const draw = getKeyboardDraw(map, "measureDistance")!;
		const finish = vi.spyOn(draw, "finishDrawing");
		draw.appendCoordinates([
			[100, 200],
			[300, 400],
		]);
		fireEvent.click(screen.getByRole("button", {name: "Fertig"}));
		expect(finish).toHaveBeenCalledTimes(1);
	});

	it("shares the current centre from the visible button", async () => {
		const {store, map} = setup();
		map.getView().setCenter([0, 0]);
		render(
			<Provider store={store}>
				<SharePositionLinkButton opened />
			</Provider>,
		);
		fireEvent.click(
			screen.getByRole("button", {name: "Kartenmitte teilen"}),
		);
		expect(
			(
				await screen.findByRole<HTMLInputElement>("textbox", {
					name: "Link zum Teilen",
				})
			).value,
		).toMatch(/#lm=0\/0$/);
	});

	it("keeps pointer instructions and hides keyboard controls when disabled", () => {
		const {store} = setup(false);
		render(
			<Provider store={store}>
				<MeasureDistanceButton opened />
				<SharePositionLinkButton opened />
			</Provider>,
		);
		expect(screen.queryByRole("button", {name: "Fertig"})).toBeNull();
		expect(
			screen.queryByRole("button", {name: "Kartenmitte teilen"}),
		).toBeNull();
		expect(screen.queryByText(/Rücktaste/)).toBeNull();
	});
});
