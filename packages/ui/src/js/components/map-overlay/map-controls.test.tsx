import {Provider} from "react-redux";

import {configureStore, createAction} from "@reduxjs/toolkit";
import {act, cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {announceStatus} from "../../helpers/announce-status";
import RegionSelector from "./region-selector";
import UserGeoLocationButton from "./user-geo-location-button";

vi.mock("../../helpers/announce-status", () => ({announceStatus: vi.fn()}));

afterEach(cleanup);

describe("map overlay accessibility", () => {
	it("exposes the selected region with aria-pressed", () => {
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
		const pressed = (name: string) =>
			screen.getByRole("button", {name}).getAttribute("aria-pressed");
		expect(pressed("City")).toBe("true");
		expect(pressed("Park")).toBe("false");
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

		act(() => {
			store.dispatch(updateGeo({isRequesting: true, error: false}));
		});
		expect(announceStatus).toHaveBeenCalledWith(
			"Standort wird ermittelt …",
		);
		act(() => {
			store.dispatch(updateGeo({isRequesting: false, error: true}));
		});
		expect(announceStatus).toHaveBeenCalledWith(
			"Standort konnte nicht ermittelt werden.",
		);
		expect(announceStatus).toHaveBeenCalledTimes(2);
	});
});
