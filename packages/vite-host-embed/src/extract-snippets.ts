import {readFileSync} from "node:fs";
import path from "node:path";

import type {HostEmbedConfig, HostEmbedSnippetConfig} from "./types.ts";

export const SNIPPET_START = "<!-- mapsight:snippet:start -->";
export const SNIPPET_END = "<!-- mapsight:snippet:end -->";
const CMS_HINT_HTML = /\s*<!-- mapsight:cms:[\s\S]*?-->/g;

/** Remove `<!---->` placeholders left by Vite's dep scanner after HTML comments. */
export function stripHtmlCommentPlaceholdersFromScript(code: string): string {
	return code.replace(/\s*<!---->/g, "");
}

/** Remove CMS paste hints from inline scripts so Vite can parse dev HTML. */
export function stripCmsHintsForDevHtml(html: string): string {
	return html.replace(CMS_HINT_HTML, "");
}

export function extractSnippetRegion(source: string, filePath: string): string {
	const start = source.indexOf(SNIPPET_START);
	const end = source.indexOf(SNIPPET_END);

	if (start === -1 || end === -1 || end < start) {
		throw new Error(`Missing snippet markers in ${filePath}`);
	}

	return source
		.slice(start + SNIPPET_START.length, end)
		.replace(
			/<!-- mapsight:dev-only -->[\s\S]*?<!-- \/mapsight:dev-only -->/g,
			"",
		)
		.trim();
}

export function renderSnippetDocument(
	config: HostEmbedConfig,
	description: string,
	bodyMarkup: string,
): string {
	return `<!--
${description}

Deploy prefix example: ${config.assetsBase}/
Replace container id, URLs, and coordinates per placement.
-->
${bodyMarkup}
`;
}

export function buildSnippetsFromHtml(
	appRoot: string,
	config: HostEmbedConfig,
): Record<string, HostEmbedSnippetConfig> {
	const snippets: Record<string, HostEmbedSnippetConfig> = {};

	for (const source of config.snippetSources) {
		const filePath = path.join(appRoot, source.file);
		const markup = extractSnippetRegion(
			readFileSync(filePath, "utf8"),
			filePath,
		);
		const description =
			source.description ?? `Mapsight host embed example: ${source.name}`;

		snippets[source.name] = {
			contents: renderSnippetDocument(config, description, markup),
		};
	}

	return snippets;
}
