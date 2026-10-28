/** Local deployment check: mirrors Caddy try_files {path} /index.html. */
import {readFile, stat} from "node:fs/promises";
import {createServer} from "node:http";
import {extname, resolve, sep} from "node:path";

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
}).listen(5176, "127.0.0.1", () =>
	console.log("Static try_files fixture: http://127.0.0.1:5176"),
);
