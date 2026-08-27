import {describe, expect, it, vi} from "vitest";

import createServerHandler from "./server-handler.js";

describe("createServerHandler", () => {
	it("returns text/html fragment with dehydrated state", () => {
		const handler = createServerHandler("/mapsight/");
		const write = vi.fn();
		const end = vi.fn();
		const writeHead = vi.fn();
		const res = {writeHead, write, end};

		handler(
			{
				url: "/mapsight/render",
				body: {
					options: {
						styleFunction: vi.fn(),
						baseMapsightConfig: {
							map: {layers: {base: {type: "OSM"}}},
						},
						createOptions: {
							renderer: () => "<div>shell</div>",
							plugins: [],
							validateConfig: false,
							uiState: {title: "handler"},
						},
						containerId: "mapsight-embed-1",
					},
				},
			},
			res,
			vi.fn(),
		);

		expect(writeHead).toHaveBeenCalledWith(200, {
			"Content-Type": "text/html; charset=utf-8",
		});
		expect(write).toHaveBeenCalledWith(
			expect.stringContaining('id="mapsight-embed-1"'),
		);
		expect(write).toHaveBeenCalledWith(
			expect.stringContaining("data-dehydrated-state='"),
		);
		expect(write).toHaveBeenCalledWith(
			expect.stringContaining("<div>shell</div>"),
		);
		expect(end).toHaveBeenCalledOnce();
	});

	it("rejects requests missing containerId", () => {
		const handler = createServerHandler();
		const writeHead = vi.fn();
		const end = vi.fn();

		handler(
			{
				url: "/mapsight/render",
				body: {
					options: {
						styleFunction: vi.fn(),
						baseMapsightConfig: {},
					},
				},
			},
			{writeHead, write: vi.fn(), end},
			vi.fn(),
		);

		expect(writeHead).toHaveBeenCalledWith(
			400,
			expect.objectContaining({
				"Content-Type": "text/plain; charset=utf-8",
			}),
		);
		expect(end).toHaveBeenCalled();
	});
});
