import {readFileSync} from "node:fs";
import path from "node:path";

import type {Plugin} from "vite";

import {extractSnippetRegion} from "./extract-snippets.ts";

export type SnippetHtmlEntryOptions = {
	/** HTML entry path relative to the app root. */
	entryFile: string;
};

/** Use only the marked snippet region as the Vite HTML entry during production builds. */
export function mapsightSnippetHtmlEntryPlugin(
	appRoot: string,
	options: SnippetHtmlEntryOptions,
): Plugin {
	const indexPath = path.join(appRoot, options.entryFile);

	return {
		name: "mapsight-snippet-html-entry",
		apply: "build",
		transformIndexHtml: {
			order: "pre",
			handler(html, ctx) {
				if (!ctx.filename?.endsWith(options.entryFile)) {
					return html;
				}

				const source = readFileSync(indexPath, "utf8");

				return extractSnippetRegion(source, indexPath);
			},
		},
	};
}
