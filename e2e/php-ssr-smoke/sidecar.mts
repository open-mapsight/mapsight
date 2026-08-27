/**
 * Minimal Node SSR sidecar for the PHP CMS smoke.
 *
 * Speaks the same fragment contract as `@mapsight/ui` server-handler /
 * `wrapEmbedFragment` without booting OpenLayers (Vitest covers that).
 */
import http from "node:http";

import {wrapEmbedFragment} from "../../packages/ui/src/js/embed/emit-fragment.ts";

const port = Number(process.env.MAPSIGHT_SSR_PORT ?? "0");
const host = process.env.MAPSIGHT_SSR_HOST ?? "127.0.0.1";

const server = http.createServer(async (req, res) => {
	if (req.method !== "POST" || req.url !== "/render") {
		res.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
		res.end("not found");
		return;
	}

	try {
		const body = await readBody(req, 256 * 1024);
		const parsed = JSON.parse(body) as {
			options?: {
				containerId?: string;
				containerClassName?: string;
				shellHtml?: string;
				dehydratedState?: unknown;
			};
		};
		const options = parsed.options;
		if (!options?.containerId) {
			res.writeHead(400, {"Content-Type": "text/plain; charset=utf-8"});
			res.end("containerId is required");
			return;
		}

		const fragment = wrapEmbedFragment({
			id: options.containerId,
			className: options.containerClassName ?? "mapsight-embed",
			html:
				options.shellHtml ??
				'<div class="mapsight-ssr-shell">ssr</div>',
			dehydratedState: options.dehydratedState ?? {
				app: {title: "php-ssr-smoke"},
			},
		});

		res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
		res.end(fragment);
	} catch (error) {
		console.error("php-ssr-smoke sidecar:", error);
		res.writeHead(500, {"Content-Type": "text/plain; charset=utf-8"});
		res.end("render failed");
	}
});

server.listen(port, host, () => {
	const address = server.address();
	if (address && typeof address === "object") {
		// Printed for the orchestrator to parse.
		console.log(
			`MAPSIGHT_SSR_READY http://${address.address}:${address.port}`,
		);
	}
});

function readBody(
	req: http.IncomingMessage,
	maxBytes: number,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		req.on("data", (chunk: Buffer) => {
			size += chunk.length;
			if (size > maxBytes) {
				reject(new Error("payload too large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			resolve(Buffer.concat(chunks).toString("utf8"));
		});
		req.on("error", reject);
	});
}
