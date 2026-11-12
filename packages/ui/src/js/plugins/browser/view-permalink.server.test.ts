// @vitest-environment node
import {describe, expect, it} from "vitest";

import createViewPermalinkPlugin from "./view-permalink";

describe("view permalink on the server", () => {
	it("is a no-op without a window", () => {
		expect(typeof window).toBe("undefined");
		const plugin = createViewPermalinkPlugin();
		expect(plugin.afterInit).toBeUndefined();
		expect(plugin.afterCreate).toBeUndefined();
		expect(() => plugin.destroy()).not.toThrow();
	});
});
