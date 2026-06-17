import fs from "node:fs/promises";
import path from "node:path";

import type {Plugin} from "vite";

import {rewriteAbsoluteAssetPaths} from "./css.ts";
import {buildSnippetsFromHtml} from "./extract-snippets.ts";
import {finalizeAppStylesheet, finalizeEntryModules} from "./finalize.ts";
import {buildHtaccess} from "./htaccess.ts";
import {renderSnippetsReadme} from "./snippets.ts";
import type {HostEmbedConfig} from "./types.ts";

export function mapsightHostEmbedPlugin(
	appRoot: string,
	config: HostEmbedConfig,
): Plugin {
	const outDir = path.join(appRoot, config.outDir ?? "dist/mapsight-assets");
	const assetsDir = path.join(outDir, "assets");
	const imgSource = path.join(appRoot, config.imgDir ?? "public/img");
	const dataSource = path.join(appRoot, config.dataDir ?? "public/data");
	const snippetsDir = path.join(
		appRoot,
		config.snippetsDir ?? "dist/snippets",
	);
	const writeHtaccess = config.writeHtaccess ?? true;

	return {
		name: "mapsight-host-embed",
		apply: "build",
		async writeBundle() {
			await fs.cp(imgSource, path.join(outDir, "img"), {recursive: true});

			try {
				await fs.access(dataSource);
				await fs.cp(dataSource, path.join(outDir, "data"), {
					recursive: true,
				});
			} catch {
				// No data directory — skip.
			}
			await finalizeAppStylesheet(assetsDir, config);
			await finalizeEntryModules(assetsDir, config);
			await rewriteAbsoluteAssetPaths(assetsDir, config.assetsBase);
			await fs.mkdir(snippetsDir, {recursive: true});

			const snippetEntries = buildSnippetsFromHtml(appRoot, config);

			for (const [name, snippet] of Object.entries(snippetEntries)) {
				await fs.writeFile(
					path.join(snippetsDir, `${name}.html`),
					snippet.contents,
					"utf8",
				);
			}

			await fs.writeFile(
				path.join(snippetsDir, "README.md"),
				renderSnippetsReadme(config),
				"utf8",
			);

			if (writeHtaccess) {
				await fs.writeFile(
					path.join(outDir, ".htaccess"),
					buildHtaccess(config),
					"utf8",
				);
			}
		},
	};
}
