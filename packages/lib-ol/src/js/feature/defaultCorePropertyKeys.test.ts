import {describe, expect, it} from "vitest";

import {
	DEFAULT_CORE_PROPERTY_KEYS,
	corePropertyKeysFromAllowedProps,
} from "./defaultCorePropertyKeys.ts";

describe("corePropertyKeysFromAllowedProps", () => {
	it("returns the default set when allowedProps is missing, false, or empty", () => {
		expect(corePropertyKeysFromAllowedProps()).toBe(
			DEFAULT_CORE_PROPERTY_KEYS,
		);
		expect(corePropertyKeysFromAllowedProps(false)).toBe(
			DEFAULT_CORE_PROPERTY_KEYS,
		);
		expect(corePropertyKeysFromAllowedProps([])).toBe(
			DEFAULT_CORE_PROPERTY_KEYS,
		);
		expect(corePropertyKeysFromAllowedProps(false).has("tagGroups")).toBe(
			false,
		);
	});

	it("unions compiled allowedProps with the default identity/style keys", () => {
		const keys = corePropertyKeysFromAllowedProps([
			"myHostKey",
			"occupancyTrendString",
		]);

		expect(keys.has("myHostKey")).toBe(true);
		expect(keys.has("occupancyTrendString")).toBe(true);
		expect(keys.has("markerCaption")).toBe(true);
		expect(keys.has("id")).toBe(true);
		expect(keys.has("tagGroups")).toBe(false);
		expect(keys).not.toBe(DEFAULT_CORE_PROPERTY_KEYS);
	});
});
