import {describe, expect, it} from "vitest";

import {render, renderEnvelope} from "./render.ts";

describe("render", () => {
	it("requires containerId", () => {
		expect(() => render({preset: "test"})).toThrow(
			expect.objectContaining({
				message: "options.containerId is required",
				statusCode: 400,
			}),
		);
	});

	it("uses the generic embed class and stub state", () => {
		const html = render({
			preset: "infosite",
			options: {containerId: "mapsight-embed-1"},
		});

		expect(html).toContain('id="mapsight-embed-1"');
		expect(html).toContain('class="mapsight-embed"');
		expect(html).toContain("data-dehydrated-state=");
		expect(html).not.toContain("bs-mapsight-embed");
		expect(html).toContain("&quot;ssr&quot;:&quot;stub&quot;");
	});
});

describe("renderEnvelope", () => {
	it("returns the fragment with null pageMeta", async () => {
		const envelope = await renderEnvelope({
			options: {containerId: "mapsight-embed-1"},
		});
		expect(envelope.pageMeta).toBeNull();
		expect(envelope.html).toContain('id="mapsight-embed-1"');
	});
});
