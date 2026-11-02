/** Local deployment check: mirrors Caddy try_files {path} /index.html. */
import {readFile, stat} from "node:fs/promises";
import {createServer} from "node:http";
import {extname, resolve, sep} from "node:path";
import {parseArgs} from "node:util";

const {values} = parseArgs({
	options: {
		port: {type: "string", default: "5176"},
		"audit-tiles": {type: "boolean", default: false},
	},
});
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535)
	throw new Error("Invalid fixture port");
const root = resolve(import.meta.dirname, "../dist");
const types: Record<string, string> = {
	".html": "text/html",
	".js": "text/javascript",
	".css": "text/css",
	".json": "application/json",
	".geojson": "application/geo+json",
	".svg": "image/svg+xml",
	".png": "image/png",
	".woff2": "font/woff2",
	".md": "text/plain",
	".txt": "text/plain",
};
createServer((req, res) => {
	void (async () => {
		try {
			const pathname = new URL(req.url!, "http://localhost").pathname;
			const tile = /^\/tiles\/osm\/(\d+)\/(\d+)\/(\d+)\.png$/.exec(
				pathname,
			);
			if (values["audit-tiles"] && tile) {
				// Test-only texture: makes panning observable even without upstream
				// tiles or feature markers. No real map imagery or external requests.
				res.writeHead(200, {"Content-Type": "image/svg+xml"});
				res.end(
					`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e8e8e4"/><path d="M0 0H256V256H0ZM0 91H256M117 0V256" fill="none" stroke="#b4b9bb" stroke-width="2"/><text x="12" y="45" font-family="sans-serif" font-size="13" fill="#66747c">Audit fixture ${tile[1]}/${tile[2]}/${tile[3]}</text></svg>`,
				);
				return;
			}
			let path = resolve(
				root,
				"." +
					decodeURIComponent(
						new URL(req.url!, "http://localhost").pathname,
					),
			);
			if (!path.startsWith(root + sep))
				path = resolve(root, "index.html");
			if (!(await stat(path).catch(() => null))?.isFile())
				path = resolve(root, "index.html");
			res.writeHead(200, {
				"Content-Type":
					types[extname(path)] ?? "application/octet-stream",
			});
			res.end(await readFile(path));
		} catch {
			res.writeHead(500);
			res.end();
		}
	})();
}).listen(port, "127.0.0.1", () =>
	console.log(
		`Static try_files fixture: http://127.0.0.1:${port}${values["audit-tiles"] ? " (synthetic audit tiles)" : ""}`,
	),
);
