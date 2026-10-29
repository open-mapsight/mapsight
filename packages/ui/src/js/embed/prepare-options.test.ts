import {describe, expect, it, vi} from "vitest";

import {prepareBrowserCreateOptions} from "./prepare-options";

vi.mock("../plugins/browser-defaults", () => ({
	default: (options: object) => [["defaults", {afterCreate: () => options}]],
}));

vi.mock("../plugins/browser/partial-content-changed-event", () => ({
	default: () => ({afterCreate: () => undefined}),
}));

describe("browser embed plugin setup", () => {
	it.each([undefined, false])(
		"keeps plugins explicit with useDefaultPlugins=%s",
		(useDefaultPlugins) => {
			const handler = vi.fn();
			const options = {
				useDefaultPlugins,
				plugins: [["host", null]] as [string, null][],
				partialChangeHandler: handler,
			};
			const prepared = prepareBrowserCreateOptions(options);
			expect(prepared.plugins).toEqual([["host", null]]);
			expect(prepared.partialChangeHandler).toBe(handler);
			expect(options.plugins).toEqual([["host", null]]);
		},
	);

	it.each([true, {lang: {lang: "en"}}])(
		"prepends defaults and partial-content events with %j",
		(useDefaultPlugins) => {
			const prepared = prepareBrowserCreateOptions({
				useDefaultPlugins,
				plugins: [["host", null]],
			});
			expect(prepared.plugins?.map(([name]) => name)).toEqual([
				"defaults",
				"partialContentChangedEvent",
				"host",
			]);
			expect(prepared.partialChangeHandler).toBeUndefined();
		},
	);
});
