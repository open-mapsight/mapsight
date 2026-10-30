import {describe, expect, it, vi} from "vitest";
import {z} from "zod";

import {createFetchClient} from "./fetch-client.js";

const endpoints = [
	{
		method: "get",
		path: "/:type/stations",
		alias: "stations",
		parameters: [],
		response: z.object({data: z.array(z.unknown())}),
	},
] as const;

function jsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: {"Content-Type": "application/json"},
	});
}

describe("createFetchClient request cancellation", () => {
	it("forwards the call signal to fetch", async () => {
		const fetchMock = vi.fn<typeof fetch>(() =>
			Promise.resolve(jsonResponse({data: []})),
		);
		const client = createFetchClient("https://api.example", endpoints, {
			fetch: fetchMock,
		});
		const controller = new AbortController();

		await client.stations({
			params: {type: "bicycle"},
			signal: controller.signal,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example/bicycle/stations",
			expect.objectContaining({signal: controller.signal}),
		);
	});

	it("does not set a signal when none is passed", async () => {
		const fetchMock = vi.fn<typeof fetch>(() =>
			Promise.resolve(jsonResponse({data: []})),
		);
		const client = createFetchClient("https://api.example", endpoints, {
			fetch: fetchMock,
		});

		await client.stations({params: {type: "bicycle"}});

		expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty("signal");
	});

	it("rejects with the abort reason when the signal aborts", async () => {
		const fetchMock = vi.fn<typeof fetch>(
			(_input, init) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () => {
						const reason: unknown = init.signal?.reason;
						reject(
							reason instanceof Error
								? reason
								: new DOMException("Aborted", "AbortError"),
						);
					});
				}),
		);
		const client = createFetchClient("https://api.example", endpoints, {
			fetch: fetchMock,
		});
		const controller = new AbortController();

		const pending = client.stations({
			params: {type: "bicycle"},
			signal: controller.signal,
		});
		controller.abort();

		await expect(pending).rejects.toMatchObject({name: "AbortError"});
	});
});
