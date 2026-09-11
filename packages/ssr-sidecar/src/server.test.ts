import {fileURLToPath} from "node:url";

import {afterAll, beforeAll, describe, expect, it} from "vitest";

import {type SsrSidecarListen, startSsrSidecar} from "./server.ts";

describe("ssr sidecar HTTP contract", () => {
	let listen: SsrSidecarListen;
	let base: string;

	beforeAll(async () => {
		listen = await startSsrSidecar({
			host: "127.0.0.1",
			port: 0,
			modulePath: fileURLToPath(new URL("./render.ts", import.meta.url)),
		});
		base = `http://127.0.0.1:${listen.port}`;
	});

	afterAll(async () => {
		await new Promise<void>((resolve, reject) => {
			listen.server.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	});

	it("serves GET /health", async () => {
		const response = await fetch(`${base}/health`);
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("ok");
	});

	it("renders POST /v1/render", async () => {
		const response = await fetch(`${base}/v1/render`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				preset: "test",
				options: {containerId: "mapsight-embed-1"},
			}),
		});
		expect(response.status).toBe(200);
		const payload = (await response.json()) as {
			v: number;
			html: string;
			state: unknown;
			pageMeta: unknown;
		};
		expect(payload.v).toBe(1);
		expect(payload.html).toContain('id="mapsight-embed-1"');
		expect(payload.pageMeta).toBeNull();
		expect(payload.state).toEqual({
			app: {ssr: "stub", preset: "test"},
		});
	});

	it("clears cache keys on POST /purge", async () => {
		const response = await fetch(`${base}/purge`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: "{}",
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([]);
	});

	it("does not expose POST /render", async () => {
		const response = await fetch(`${base}/render`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				options: {containerId: "mapsight-embed-1"},
			}),
		});
		expect(response.status).toBe(404);
		expect(await response.text()).toBe("not found");
	});

	it("returns 404 for unknown routes", async () => {
		const response = await fetch(`${base}/foo`);
		expect(response.status).toBe(404);
	});
});
