import {afterEach, describe, expect, it, vi} from "vitest";

import {validateMapsightConfig} from "../schema/validate";
import {plain} from "./sources";

describe("plain", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("creates an empty noop source without data", () => {
		expect(plain()).toEqual({type: "noop"});
		expect("data" in plain()).toBe(false);
	});

	it("includes initial data when given", () => {
		const data = {type: "FeatureCollection" as const, features: []};
		expect(plain(data)).toEqual({type: "noop", data});
	});

	it("passes validation with initial data without warnings", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.stubGlobal("process", {
			...process,
			env: {...process.env, NODE_ENV: "development"},
		});
		const config = {
			featureSources: {
				drawn: {
					...plain({
						type: "FeatureCollection",
						features: [
							{
								type: "Feature",
								id: "a",
								geometry: {type: "Point", coordinates: [1, 2]},
								properties: {},
							},
						],
					}),
				},
				empty: plain({type: "FeatureCollection", features: []}),
			},
		};

		expect(validateMapsightConfig(config)).toEqual(config);
		expect(warn).not.toHaveBeenCalled();
	});

	it("still rejects unknown keys on a feature source", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.stubGlobal("process", {
			...process,
			env: {...process.env, NODE_ENV: "development"},
		});

		validateMapsightConfig({
			featureSources: {drawn: {...plain(), bogus: true}},
		});

		expect(warn).toHaveBeenCalled();
	});
});
