import {describe, expect, it} from "vitest";

import {supportsGeoProtocol} from "./supports-geo-protocol";

describe("supportsGeoProtocol", () => {
	it("trusts the Client Hint when the device is mobile", () => {
		expect(
			supportsGeoProtocol({mobile: true, userAgent: "Mozilla/5.0"}),
		).toBe(true);
	});

	it("trusts the Client Hint when the device is not mobile", () => {
		expect(
			supportsGeoProtocol({
				mobile: false,
				userAgent:
					"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
			}),
		).toBe(false);
	});

	it("falls back to mobile UA tokens when Client Hints are missing", () => {
		expect(
			supportsGeoProtocol({
				mobile: null,
				userAgent:
					"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
			}),
		).toBe(true);
		expect(
			supportsGeoProtocol({
				userAgent:
					"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
			}),
		).toBe(true);
		expect(
			supportsGeoProtocol({
				userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
			}),
		).toBe(false);
	});

	it("is false when no environment is available", () => {
		expect(supportsGeoProtocol({})).toBe(false);
	});
});
