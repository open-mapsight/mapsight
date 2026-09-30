import http from "node:http";
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

	function postRender(body: string, headers: Record<string, string> = {}) {
		return fetch(`${base}/v1/render`, {
			method: "POST",
			headers: {"Content-Type": "application/json", ...headers},
			body,
		});
	}

	it.each([
		["null", "null"],
		["an array", "[]"],
		["a string", '"render"'],
	])("rejects %s render body with 400", async (_label, body) => {
		const response = await postRender(body, {"X-Request-Id": "req-1"});
		expect(response.status).toBe(400);
		expect(response.headers.get("x-request-id")).toBe("req-1");
		expect(await response.json()).toMatchObject({
			error: {code: "VALIDATION"},
		});
	});

	it.each([
		["a CRLF requestId", {requestId: "req\r\nX-Injected: 1"}],
		["a numeric requestId", {requestId: 42}],
		["an overlong requestId", {requestId: "r".repeat(129)}],
		["an assetVersion with spaces", {assetVersion: "v 1"}],
	])("rejects %s with 400", async (_label, fields) => {
		const response = await postRender(
			JSON.stringify({preset: "test", ...fields}),
		);
		expect(response.status).toBe(400);
		expect(response.headers.get("x-request-id")).toBeNull();
		expect(await response.json()).toMatchObject({
			error: {code: "VALIDATION"},
		});
	});

	it("rejects an X-Request-Id header outside printable ASCII with 400", async () => {
		const response = await postRender(JSON.stringify({preset: "test"}), {
			"X-Request-Id": "req 1",
		});
		expect(response.status).toBe(400);
		expect(response.headers.get("x-request-id")).toBeNull();
	});

	it("echoes a valid body requestId", async () => {
		const response = await postRender(
			JSON.stringify({preset: "test", requestId: "body-req"}),
			{"X-Request-Id": "header-req"},
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("x-request-id")).toBe("body-req");
	});

	it("responds 413 with Connection: close to an oversized body", async () => {
		const response = await new Promise<{
			status: number | undefined;
			connection: string | undefined;
			body: string;
		}>((resolve, reject) => {
			const req = http.request(
				`${base}/v1/render`,
				{method: "POST", headers: {"Content-Type": "application/json"}},
				(res) => {
					let body = "";
					res.setEncoding("utf8");
					res.on("data", (chunk: string) => {
						body += chunk;
					});
					res.on("end", () => {
						resolve({
							status: res.statusCode,
							connection: res.headers.connection,
							body,
						});
					});
				},
			);
			req.on("error", reject);
			req.end(JSON.stringify({padding: "x".repeat(300 * 1024)}));
		});

		expect(response.status).toBe(413);
		expect(response.connection).toBe("close");
		expect(JSON.parse(response.body)).toMatchObject({
			error: {code: "BODY_TOO_LARGE"},
		});
	});
});
