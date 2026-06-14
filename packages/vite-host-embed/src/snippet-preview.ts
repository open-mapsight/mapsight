import fs from "node:fs/promises";
import type {IncomingMessage, ServerResponse} from "node:http";
import path from "node:path";

import type {Plugin, PreviewServer} from "vite";

type ConnectNext = (err?: unknown) => void;

async function serveSnippet(
	req: IncomingMessage,
	res: ServerResponse,
	next: ConnectNext,
	snippetsDir: string,
	urlPrefix: string,
): Promise<void> {
	const pathname = req.url?.split("?")[0] ?? "";

	if (!pathname.startsWith(urlPrefix)) {
		next();
		return;
	}

	const relativePath = pathname.slice(urlPrefix.length);
	if (!relativePath || relativePath.includes("..")) {
		next();
		return;
	}

	const filePath = path.join(snippetsDir, relativePath);

	try {
		const contents = await fs.readFile(filePath, "utf8");
		res.statusCode = 200;
		res.setHeader(
			"Content-Type",
			relativePath.endsWith(".md")
				? "text/markdown; charset=utf-8"
				: "text/html; charset=utf-8",
		);
		res.end(contents);
	} catch {
		next();
	}
}

export type SnippetPreviewOptions = {
	/** Snippet output directory relative to the app root. Default: `dist/snippets`. */
	snippetsDir?: string;
	/** Preview URL prefix. Default: `/cms-snippets/`. */
	urlPrefix?: string;
};

/** Serve paste-ready snippet files during `vite preview`. */
export function mapsightSnippetPreviewPlugin(
	appRoot: string,
	options: SnippetPreviewOptions = {},
): Plugin {
	const snippetsDir = path.join(
		appRoot,
		options.snippetsDir ?? "dist/snippets",
	);
	const urlPrefix = options.urlPrefix ?? "/cms-snippets/";

	return {
		name: "mapsight-snippet-preview",
		configurePreviewServer(server: PreviewServer) {
			server.middlewares.use((req, res, next) => {
				void serveSnippet(req, res, next, snippetsDir, urlPrefix);
			});
		},
	};
}
