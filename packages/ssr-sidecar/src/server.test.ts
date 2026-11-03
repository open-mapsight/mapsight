import {mkdtemp, rm, writeFile} from "node:fs/promises";
import http from "node:http";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {afterAll, beforeAll, describe, expect, it} from "vitest";

import {type SsrSidecarListen, startSsrSidecar} from "./server.ts";

function closeServer(listen: SsrSidecarListen): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		listen.server.close((error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

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
			JSON.stringify({
				preset: "test",
				requestId: "body-req",
				options: {containerId: "mapsight-embed-1"},
			}),
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

describe("ssr sidecar POST /v1/og", () => {
	const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	let stub: SsrSidecarListen;
	let product: SsrSidecarListen;
	let legacy: SsrSidecarListen;
	let dir: string;

	beforeAll(async () => {
		stub = await startSsrSidecar({
			host: "127.0.0.1",
			port: 0,
			modulePath: fileURLToPath(new URL("./render.ts", import.meta.url)),
		});
		dir = await mkdtemp(path.join(tmpdir(), "mapsight-ssr-og-"));
		const modulePath = path.join(dir, "render.mjs");
		await writeFile(
			modulePath,
			[
				"export function render(body) {",
				'\treturn `<div id="${body.options.containerId}" data-dehydrated-state="{}"></div>`;',
				"}",
				"export function renderOgImage(body) {",
				"\tif (body.options?.requestUrl === '/tokens') return Buffer.from(JSON.stringify({requestId: body.requestId, assetVersion: body.assetVersion}));",
				"\treturn body.options?.requestUrl?.includes('feature=')",
				`\t\t? Buffer.from([${[...png].join(", ")}])`,
				"\t\t: null;",
				"}",
				"",
			].join("\n"),
		);
		product = await startSsrSidecar({
			host: "127.0.0.1",
			port: 0,
			modulePath,
		});
		const legacyPath = path.join(dir, "legacy.mjs");
		await writeFile(
			legacyPath,
			"export function render() { return '<div></div>'; }\n",
		);
		legacy = await startSsrSidecar({
			host: "127.0.0.1",
			port: 0,
			modulePath: legacyPath,
		});
	});

	afterAll(async () => {
		await closeServer(stub);
		await closeServer(product);
		await closeServer(legacy);
		await rm(dir, {recursive: true, force: true});
	});

	function post(
		listen: SsrSidecarListen,
		body: string,
		headers: Record<string, string> = {},
	) {
		return fetch(`http://127.0.0.1:${listen.port}/v1/og`, {
			method: "POST",
			headers: {"Content-Type": "application/json", ...headers},
			body,
		});
	}

	it("answers NOT_FOUND when the module has no card", async () => {
		const response = await post(
			stub,
			JSON.stringify({
				preset: "test",
				options: {
					containerId: "mapsight-embed-1",
					requestUrl: "/plan?feature=poi-1",
				},
			}),
			{"X-Request-Id": "og-1"},
		);
		expect(response.status).toBe(404);
		expect(response.headers.get("x-request-id")).toBe("og-1");
		expect(await response.json()).toEqual({
			v: 1,
			error: {code: "NOT_FOUND", message: "no og image for this request"},
		});
	});

	it("keeps older product modules without an OG renderer supported", async () => {
		const response = await post(
			legacy,
			JSON.stringify({requestId: "body-request"}),
		);
		expect(response.status).toBe(404);
		expect(response.headers.get("x-request-id")).toBe("body-request");
		expect(await response.json()).toMatchObject({
			error: {
				code: "NOT_FOUND",
				message: "module has no renderOgImage()",
			},
		});
	});

	it("rejects oversized OG bodies and closes the connection", async () => {
		const response = await post(
			product,
			JSON.stringify({padding: "x".repeat(300 * 1024)}),
		);
		expect(response.status).toBe(413);
		expect(response.headers.get("connection")).toBe("close");
		expect(await response.json()).toMatchObject({
			error: {code: "BODY_TOO_LARGE"},
		});
	});

	it("rejects invalid JSON", async () => {
		const response = await post(stub, "{");
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			v: 1,
			error: {code: "VALIDATION", message: "invalid JSON"},
		});
	});

	it.each(["null", "[]", '"card"', "42", "true"])(
		"rejects a non-object OG body %s",
		async (body) => {
			const response = await post(product, body, {
				"X-Request-Id": "og-validation",
			});
			expect(response.status).toBe(400);
			expect(response.headers.get("x-request-id")).toBe("og-validation");
			expect(await response.json()).toMatchObject({
				error: {code: "VALIDATION"},
			});
		},
	);

	it.each([
		{requestId: "bad\r\nheader"},
		{requestId: 42},
		{requestId: "r".repeat(129)},
		{assetVersion: "version with spaces"},
	])("rejects invalid OG body tokens %j", async (fields) => {
		const response = await post(product, JSON.stringify(fields));
		expect(response.status).toBe(400);
		expect(response.headers.get("x-request-id")).toBeNull();
		expect(await response.json()).toMatchObject({
			error: {code: "VALIDATION"},
		});
	});

	it.each(["X-Request-Id", "X-Mapsight-Asset-Version"])(
		"rejects an invalid %s OG header",
		async (header) => {
			const response = await post(product, "{}", {
				[header]: "invalid token",
			});
			expect(response.status).toBe(400);
			expect(response.headers.get("x-request-id")).toBeNull();
			expect(await response.json()).toMatchObject({
				error: {code: "VALIDATION"},
			});
		},
	);

	it.each([
		[{}, {requestId: "header-request", assetVersion: "header-version"}],
		[
			{requestId: "body-request", assetVersion: "body-version"},
			{requestId: "body-request", assetVersion: "body-version"},
		],
	])(
		"forwards validated OG tokens with body precedence %j",
		async (fields, expected) => {
			const response = await post(
				product,
				JSON.stringify({options: {requestUrl: "/tokens"}, ...fields}),
				{
					"X-Request-Id": "header-request",
					"X-Mapsight-Asset-Version": "header-version",
				},
			);
			expect(response.status).toBe(200);
			expect(response.headers.get("x-request-id")).toBe(
				expected.requestId,
			);
			expect(JSON.parse(await response.text())).toEqual(expected);
		},
	);

	it("streams the product module's PNG", async () => {
		const response = await post(
			product,
			JSON.stringify({
				preset: "test",
				options: {
					containerId: "mapsight-embed-1",
					requestUrl: "/plan/?feature=poi-1",
				},
			}),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("image/png");
		expect(response.headers.get("content-length")).toBe(String(png.length));
		expect(Buffer.from(await response.arrayBuffer())).toEqual(png);
	});

	it("answers NOT_FOUND when the product module returns null", async () => {
		const response = await post(
			product,
			JSON.stringify({
				preset: "test",
				options: {
					containerId: "mapsight-embed-1",
					requestUrl: "/plan/",
				},
			}),
		);
		expect(response.status).toBe(404);
	});
});
