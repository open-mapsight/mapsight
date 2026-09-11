/**
 * Generic Mapsight SSR sidecar — Node 24.
 *
 * Env:
 *   MAPSIGHT_SSR_HOST (default 0.0.0.0)
 *   MAPSIGHT_SSR_PORT (default 4123)
 *   MAPSIGHT_SSR_MODULE — ESM module exporting render(body)
 *     (sync string, Promise<string>, or { html, state }; this server always awaits)
 *     and optionally renderEnvelope(body) → { html, pageMeta } and purge(urls?)
 *   MAPSIGHT_SSR_AWAIT_TIMEOUT_MS — read by the product module (not this server);
 *     keep the host HTTP timeout above that budget
 *   HTTP_PROXY / HTTPS_PROXY / NO_PROXY — http.setGlobalProxyFromEnv (all fetch)
 *   MAPSIGHT_SSR_HTTP_ORIGINS — comma hosts rewritten https→http (hairpin)
 *
 * Routes:
 *   GET  /health
 *   POST /v1/render  → JSON { v, html, state, pageMeta, meta }
 *   POST /purge      → JSON string[] of deleted cache keys
 */
import http from "node:http";
import type {IncomingMessage, ServerResponse} from "node:http";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
	installEnvHttpProxyDispatcher,
	installHttpsOriginRewrite,
} from "./proxy.ts";
import {type PurgeFn, parsePurgeUrls, runPurge} from "./purge.ts";
import type {SsrEnvelope, SsrRequestBody} from "./render.ts";
import {
	type SsrRenderResult,
	type SsrV1Error,
	type SsrV1ErrorCode,
	type SsrV1Success,
	normalizeRenderResult,
} from "./v1.ts";

export type SsrSidecarOptions = {
	host?: string;
	port?: number;
	modulePath?: string;
};

export type SsrSidecarListen = {
	server: http.Server;
	host: string;
	port: number;
	modulePath: string;
};

type RenderFn = (
	body: SsrRequestBody,
) => SsrRenderResult | Promise<SsrRenderResult>;

type RenderEnvelopeFn = (
	body: SsrRequestBody,
) => SsrEnvelope | Promise<SsrEnvelope>;

const maxBodyBytes = 256 * 1024;

export function defaultRenderModulePath(): string {
	return fileURLToPath(new URL("./render.js", import.meta.url));
}

export async function startSsrSidecar(
	options: SsrSidecarOptions = {},
): Promise<SsrSidecarListen> {
	const host = options.host ?? process.env.MAPSIGHT_SSR_HOST ?? "0.0.0.0";
	const port =
		options.port ?? Number(process.env.MAPSIGHT_SSR_PORT ?? "4123");
	const modulePath =
		options.modulePath ??
		process.env.MAPSIGHT_SSR_MODULE ??
		defaultRenderModulePath();
	const proxyUrl = installEnvHttpProxyDispatcher();
	const httpOrigins = installHttpsOriginRewrite();

	const loaded = (await import(pathToFileURL(modulePath).href)) as {
		render?: RenderFn;
		renderEnvelope?: RenderEnvelopeFn;
		purge?: PurgeFn;
	};
	const loadedRender = loaded.render;
	if (typeof loadedRender !== "function") {
		throw new Error(
			`MAPSIGHT_SSR_MODULE must export render(): ${modulePath}`,
		);
	}
	const render: RenderFn = loadedRender;
	const loadedEnvelope = loaded.renderEnvelope;
	const renderEnvelope: RenderEnvelopeFn | undefined =
		typeof loadedEnvelope === "function" ? loadedEnvelope : undefined;
	if (renderEnvelope === undefined) {
		console.warn(
			"ssr: MAPSIGHT_SSR_MODULE has no renderEnvelope(); pageMeta stays null",
		);
	}
	const loadedPurge = loaded.purge;
	const purge: PurgeFn =
		typeof loadedPurge === "function"
			? loadedPurge
			: () => {
					console.warn(
						"ssr: MAPSIGHT_SSR_MODULE has no purge(); POST /purge is a no-op",
					);
					return [];
				};

	async function loadEnvelope(body: SsrRequestBody): Promise<SsrEnvelope> {
		if (renderEnvelope !== undefined) {
			const envelope = await renderEnvelope(body);
			return {
				html: envelope.html,
				pageMeta: envelope.pageMeta ?? null,
			};
		}
		const result = await render(body);
		const html = typeof result === "string" ? result : result.html;
		return {html, pageMeta: null};
	}

	async function handlePurge(
		req: IncomingMessage,
		res: ServerResponse,
	): Promise<void> {
		try {
			const raw = await readBody(req, maxBodyBytes);
			const urls = parsePurgeUrls(raw);
			const deleted = await runPurge(purge, urls);
			res.writeHead(200, {
				"Content-Type": "application/json; charset=utf-8",
			});
			res.end(JSON.stringify(deleted));
		} catch (error) {
			const {status, code, message} = classifyError(error);
			writeV1Error(res, status, code, message);
		}
	}

	async function handleV1(
		req: IncomingMessage,
		res: ServerResponse,
	): Promise<void> {
		const started = performance.now();
		const requestId = headerValue(req, "x-request-id");
		const assetVersion = headerValue(req, "x-mapsight-asset-version");
		try {
			const raw = await readBody(req, maxBodyBytes);
			let body: SsrRequestBody;
			try {
				body = JSON.parse(raw) as SsrRequestBody;
			} catch {
				writeV1Error(res, 400, "VALIDATION", "invalid JSON", requestId);
				return;
			}
			if (requestId && body.requestId == null) {
				body.requestId = requestId;
			}
			if (assetVersion && body.assetVersion == null) {
				body.assetVersion = assetVersion;
			}
			const envelope = await loadEnvelope(body);
			const {html, state} = normalizeRenderResult(envelope.html, body);
			const payload: SsrV1Success = {
				v: 1,
				html,
				state,
				pageMeta: envelope.pageMeta,
				meta: {
					preset: body.preset,
					renderMs: Math.round(performance.now() - started),
					requestId: body.requestId ?? requestId,
					assetVersion: body.assetVersion ?? assetVersion,
				},
			};
			res.writeHead(200, {
				"Content-Type": "application/json; charset=utf-8",
				...(payload.meta.requestId
					? {"X-Request-Id": payload.meta.requestId}
					: {}),
			});
			res.end(JSON.stringify(payload));
		} catch (error) {
			const {status, code, message} = classifyError(error);
			writeV1Error(res, status, code, message, requestId);
		}
	}

	const server = http.createServer((req, res) => {
		void handleRequest(req, res);
	});

	async function handleRequest(
		req: IncomingMessage,
		res: ServerResponse,
	): Promise<void> {
		const url = req.url ?? "";
		if (req.method === "GET" && url === "/health") {
			res.writeHead(200, {"Content-Type": "text/plain; charset=utf-8"});
			res.end("ok");
			return;
		}

		if (req.method === "POST" && url === "/v1/render") {
			await handleV1(req, res);
			return;
		}

		if (req.method === "POST" && url === "/purge") {
			await handlePurge(req, res);
			return;
		}

		res.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
		res.end("not found");
	}

	await listen(server, port, host);
	const address = server.address();
	if (address === null || typeof address === "string") {
		server.close();
		throw new Error("ssr sidecar failed to bind a TCP port");
	}

	console.log(
		`mapsight ssr listening on http://${host}:${address.port} module=${modulePath}` +
			(proxyUrl === undefined ? "" : ` proxy=${proxyUrl}`) +
			(httpOrigins.length === 0
				? ""
				: ` httpOrigins=${httpOrigins.join(",")}`),
	);

	return {server, host, port: address.port, modulePath};
}

function writeV1Error(
	res: ServerResponse,
	status: number,
	code: SsrV1ErrorCode,
	message: string,
	requestId?: string,
): void {
	const payload: SsrV1Error = {v: 1, error: {code, message}};
	console.error("ssr v1:", code, message);
	res.writeHead(status, {
		"Content-Type": "application/json; charset=utf-8",
		...(requestId ? {"X-Request-Id": requestId} : {}),
	});
	res.end(JSON.stringify(payload));
}

function classifyError(error: unknown): {
	status: number;
	code: SsrV1ErrorCode;
	message: string;
} {
	const status =
		error && typeof error === "object" && "statusCode" in error
			? Number((error as {statusCode?: number}).statusCode) || 500
			: 500;
	const tagged =
		error && typeof error === "object" && "ssrCode" in error
			? String((error as {ssrCode?: string}).ssrCode)
			: "";
	if (status === 413 || tagged === "BODY_TOO_LARGE") {
		return {status: 413, code: "BODY_TOO_LARGE", message: "body too large"};
	}
	if (status === 400 || tagged === "VALIDATION") {
		const message =
			error instanceof Error ? error.message : "invalid render request";
		return {status: 400, code: "VALIDATION", message};
	}
	if (tagged === "RENDER_TIMEOUT") {
		return {
			status: 504,
			code: "RENDER_TIMEOUT",
			message: "render timed out",
		};
	}
	return {status: 500, code: "RENDER_FAILED", message: "render failed"};
}

function headerValue(req: IncomingMessage, name: string): string | undefined {
	const raw = req.headers[name];
	if (typeof raw === "string" && raw !== "") {
		return raw;
	}
	if (Array.isArray(raw) && raw[0]) {
		return raw[0];
	}
	return undefined;
}

function readBody(req: IncomingMessage, limit: number): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		req.on("data", (chunk: Buffer) => {
			size += chunk.length;
			if (size > limit) {
				reject(
					Object.assign(new Error("body too large"), {
						statusCode: 413,
						ssrCode: "BODY_TOO_LARGE",
					}),
				);
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
		req.on("error", reject);
	});
}

function listen(
	server: http.Server,
	port: number,
	host: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, host, () => {
			server.removeListener("error", reject);
			resolve();
		});
	});
}

function isExecutedAsCli(): boolean {
	const entry = process.argv[1];
	if (entry === undefined) {
		return false;
	}
	return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (isExecutedAsCli()) {
	await startSsrSidecar();
}
