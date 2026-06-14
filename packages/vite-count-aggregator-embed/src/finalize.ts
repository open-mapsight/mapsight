import fs from "node:fs/promises";
import path from "node:path";

import {
	buildCacheControlBlock,
	rewriteAbsoluteAssetPaths,
} from "@mapsight/vite-host-embed";
import type {Plugin} from "vite";

import {
	renderAppShellSnippetDocument,
	stripBuiltHtmlShell,
} from "./snippets.ts";
import type {CountAggregatorAppShellEmbedConfig} from "./types.ts";

function buildAppShellHtaccess(config: CountAggregatorAppShellEmbedConfig) {
	return `# Mapsight count-aggregator static assets under ${config.htaccessBase}/.
# Page HTML comes from the host CMS (paste ${config.snippetsDir}/${config.snippetName}.html).
<IfModule mod_rewrite.c>
	RewriteEngine On
	RewriteBase ${config.htaccessBase}/

	RewriteRule ^assets/ - [L]
</IfModule>

${buildCacheControlBlock(config.cacheConfig)}
`;
}

/** Finalize a count-aggregator app-shell build: assets-only deploy + CMS snippet. */
export function finalizeCountAggregatorAppShellPlugin(
	appRoot: string,
	config: CountAggregatorAppShellEmbedConfig,
): Plugin {
	const outDir = path.join(appRoot, config.outDir);
	const snippetsDir = path.join(appRoot, config.snippetsDir);
	const builtHtmlPath = path.join(outDir, config.builtHtmlRelativePath);
	const description =
		config.snippetDescription ?? "Mapsight count-aggregator CMS embed";

	return {
		name: "mapsight-count-aggregator-app-shell-finalize",
		apply: "build",
		async closeBundle() {
			await rewriteAbsoluteAssetPaths(
				path.join(outDir, "assets"),
				config.assetsRewriteBase,
			);

			const html = await fs.readFile(builtHtmlPath, "utf8");
			const bodyMarkup = stripBuiltHtmlShell(html);

			await fs.mkdir(snippetsDir, {recursive: true});
			await fs.writeFile(
				path.join(snippetsDir, `${config.snippetName}.html`),
				renderAppShellSnippetDocument(
					description,
					config.htaccessBase,
					bodyMarkup,
				),
				"utf8",
			);

			if (config.removeFromDeployRelativePath) {
				await fs.rm(
					path.join(outDir, config.removeFromDeployRelativePath),
					{
						recursive: true,
						force: true,
					},
				);
			}

			await fs.writeFile(
				path.join(outDir, ".htaccess"),
				buildAppShellHtaccess(config),
				"utf8",
			);
		},
	};
}
