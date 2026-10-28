// @vitest-environment node
import {afterEach, expect, it, vi} from "vitest";

import scrollBehavior from "./scroll-behavior";

afterEach(() => vi.unstubAllGlobals());
it("uses smooth scrolling without browser APIs and rechecks changed preferences", () => {
	expect(scrollBehavior()).toBe("smooth");
	const media = {matches: true};
	vi.stubGlobal("window", {matchMedia: () => media});
	expect(scrollBehavior()).toBe("instant");
	media.matches = false;
	expect(scrollBehavior()).toBe("smooth");
});
