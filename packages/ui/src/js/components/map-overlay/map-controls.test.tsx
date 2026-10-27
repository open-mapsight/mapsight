import {Provider} from "react-redux";

import {configureStore, createAction} from "@reduxjs/toolkit";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {announceStatus} from "../../helpers/announce-status";
import createMeasureDistancePlugin from "../../plugins/common/measure-distance";
import Logo from "./logo";
import MeasureDistanceInfo from "./measure-distance-overlay";
import RegionSelector from "./region-selector";
import UserGeoLocationButton from "./user-geo-location-button";

vi.mock("../../helpers/announce-status", () => ({announceStatus: vi.fn()}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("map overlay accessibility", () => {
	it("keeps the region wrapper out of the tab order and exposes the selected region", () => {
		const store = configureStore({
			reducer: () => ({
				app: {
					regions: {city: {label: "City"}, park: {label: "Park"}},
					selectedRegion: "city",
				},
			}),
		});
		render(
			<Provider store={store}>
				<RegionSelector />
			</Provider>,
		);
		expect(screen.getByRole("list").tabIndex).toBe(-1);
		expect(
			screen
				.getByRole("button", {name: "City"})
				.getAttribute("aria-pressed"),
		).toBe("true");
		expect(
			screen
				.getByRole("button", {name: "Park"})
				.getAttribute("aria-pressed"),
		).toBe("false");
		expect(screen.getByRole("button", {name: "City"}).tabIndex).toBe(0);
	});

	it("does not create a focus stop for an empty zero-height region list", () => {
		const store = configureStore({reducer: () => ({app: {regions: {}}})});
		render(
			<Provider store={store}>
				<RegionSelector />
			</Provider>,
		);
		expect(screen.getByRole("list").tabIndex).toBe(-1);
		expect(screen.queryAllByRole("button")).toHaveLength(0);
	});

	it("opens information from a named native logo button", () => {
		const store = configureStore({reducer: () => ({app: {}})});
		const dispatch = vi.spyOn(store, "dispatch");
		render(
			<Provider store={store}>
				<Logo />
			</Provider>,
		);
		const logo = screen.getByRole("button", {
			name: "Quellenangaben und weitere Informationen öffnen",
		});
		expect(logo.tagName).toBe("BUTTON");
		expect(logo.tabIndex).toBe(0);
		fireEvent.click(logo);
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({visible: true}),
		);
	});

	it("announces geolocation progress and failure once per state change", () => {
		const updateGeo = createAction<{isRequesting: boolean; error: boolean}>(
			"geo",
		);
		const store = configureStore({
			reducer: (
				state: {
					userGeolocation: {isRequesting: boolean; error: boolean};
				} = {userGeolocation: {isRequesting: false, error: false}},
				action,
			) =>
				updateGeo.match(action)
					? {userGeolocation: action.payload}
					: state,
		});
		render(
			<Provider store={store}>
				<UserGeoLocationButton />
			</Provider>,
		);
		expect(announceStatus).not.toHaveBeenCalled();

		act(() => {
			store.dispatch({
				type: "geo",
				payload: {isRequesting: true, error: false},
			});
		});
		expect(announceStatus).toHaveBeenCalledWith(
			"Standort wird ermittelt …",
		);
		act(() => {
			store.dispatch({
				type: "geo",
				payload: {isRequesting: false, error: true},
			});
		});
		expect(announceStatus).toHaveBeenCalledWith(
			"Standort konnte nicht ermittelt werden.",
		);
		expect(announceStatus).toHaveBeenCalledTimes(2);
	});

	it("announces a measurement result without repeating it on unrelated renders", () => {
		createMeasureDistancePlugin();
		const feature = {
			geometry: {
				type: "LineString",
				coordinates: [
					[10.52, 52.26],
					[10.53, 52.26],
				],
			},
		};
		const {rerender} = render(<MeasureDistanceInfo feature={feature} />);
		expect(announceStatus).toHaveBeenCalledWith(
			expect.stringMatching(/^Streckenlänge: /),
		);
		rerender(<MeasureDistanceInfo feature={feature} />);
		expect(announceStatus).toHaveBeenCalledTimes(1);
	});
});
