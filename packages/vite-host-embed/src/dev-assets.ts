import path from "node:path";

import type {Connect, Plugin, PreviewServer, ViteDevServer} from "vite";

import {
	stripCmsHintsForDevHtml,
	stripHtmlCommentPlaceholdersFromScript,
} from "./extract-snippets.ts";
import type {HostEmbedConfig} from "./types.ts";

const HTML_SCRIPT_VIRTUAL_MODULE_RE = /\?id=\d+$/;

function depScanStripCmsHintsPlugin() {
	return {
		name: "mapsight-host-embed-dep-scan",
		transform: {
			filter: {id: HTML_SCRIPT_VIRTUAL_MODULE_RE},
			handler(code: string) {
				return stripHtmlCommentPlaceholdersFromScript(code);
			},
		},
	};
}

export type HostEmbedDevAssetsOptions = Pick<
	HostEmbedConfig,
	"assetsBase" | "runtimeEntry" | "appStylesheet" | "embedTypeEntries"
> & {
	/**
	 * Dev CSS entry resolved for `${assetsBase}/assets/${appStylesheet}`.
	 * Set to `false` when the runtime entry imports CSS through Vite's module graph.
	 */
	appStylesheetEntry?: string | false;
	/** Public data directory name for `${assetsBase}/data/` rewrites. Default: `data`. */
	dataDir?: string;
};

/** Map deploy asset URLs to source modules during `vite` dev / preview. */
export function mapsightHostEmbedDevPlugin(
	appRoot: string,
	options: HostEmbedDevAssetsOptions,
): Plugin {
	const assetsBase = `${options.assetsBase}/assets`;
	const imgBase = `${options.assetsBase}/img`;
	const dataBase = `${options.assetsBase}/${options.dataDir ?? "data"}`;
	const stylesheetEntry =
		options.appStylesheetEntry === false
			? false
			: (options.appStylesheetEntry ?? "entries/mapsight.entry.css");
	const stylesheetUrl = `${assetsBase}/${options.appStylesheet}`;

	const aliases = [
		...(stylesheetEntry === false
			? []
			: [
					{
						find: stylesheetUrl,
						replacement: path.resolve(appRoot, stylesheetEntry),
					},
				]),
		{
			find: `${assetsBase}/${options.runtimeEntry}.js`,
			replacement: path.resolve(appRoot, "entries/embed.ts"),
		},
		...Object.entries(options.embedTypeEntries).map(
			([name, modulePath]) => ({
				find: `${assetsBase}/${name}.js`,
				replacement: path.resolve(appRoot, modulePath),
			}),
		),
	];

	const rewriteDeployPaths: Connect.NextHandleFunction = (req, res, next) => {
		const pathname = req.url?.split("?")[0] ?? "";

		if (stylesheetEntry === false && pathname === stylesheetUrl) {
			res.statusCode = 200;
			res.setHeader("Content-Type", "text/css; charset=utf-8");
			res.end(
				"/* Styles are injected by the Vite module graph in dev. */\n",
			);
		} else if (pathname === imgBase || pathname.startsWith(`${imgBase}/`)) {
			req.url = pathname.replace(imgBase, "/img");
			next();
		} else if (
			pathname === dataBase ||
			pathname.startsWith(`${dataBase}/`)
		) {
			req.url = pathname.replace(
				dataBase,
				`/${options.dataDir ?? "data"}`,
			);
			next();
		} else {
			next();
		}
	};

	const applyDeployPathRewrites = (server: ViteDevServer | PreviewServer) => {
		server.middlewares.use(rewriteDeployPaths);
	};

	return {
		name: "mapsight-host-embed-dev-assets",
		config: () => ({
			resolve: {
				alias: aliases,
			},
			optimizeDeps: {
				rolldownOptions: {
					plugins: [depScanStripCmsHintsPlugin()],
				},
			},
		}),
		transformIndexHtml: {
			order: "pre",
			handler(html) {
				return stripCmsHintsForDevHtml(html);
			},
		},
		configureServer: applyDeployPathRewrites,
		configurePreviewServer: applyDeployPathRewrites,
	};
}
