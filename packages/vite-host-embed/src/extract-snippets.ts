import {readFileSync} from "node:fs";
import path from "node:path";

import type {HostEmbedConfig, HostEmbedSnippetConfig} from "./types.ts";

export const SNIPPET_START = "<!-- mapsight:snippet:start -->";
export const SNIPPET_END = "<!-- mapsight:snippet:end -->";
const EMPTY_HTML_COMMENT = "<!---->";
const CMS_HINT_START = "<!-- mapsight:cms:";
const HTML_COMMENT_END = "-->";

function withoutTrailingAsciiWhitespace(value: string): string {
	let end = value.length;

	while (end > 0) {
		const charCode = value.charCodeAt(end - 1);

		if (
			charCode !== 0x09 &&
			charCode !== 0x0a &&
			charCode !== 0x0c &&
			charCode !== 0x0d &&
			charCode !== 0x20
		) {
			break;
		}

		end -= 1;
	}

	return value.slice(0, end);
}

function appendWithoutTrailingWhitespace(
	result: string,
	value: string,
): string {
	return result + withoutTrailingAsciiWhitespace(value);
}

/** Remove `<!---->` placeholders left by Vite's dep scanner after HTML comments. */
export function stripHtmlCommentPlaceholdersFromScript(code: string): string {
	let result = "";
	let cursor = 0;

	for (
		let marker = code.indexOf(EMPTY_HTML_COMMENT, cursor);
		marker !== -1;
		marker = code.indexOf(EMPTY_HTML_COMMENT, cursor)
	) {
		result = appendWithoutTrailingWhitespace(
			result,
			code.slice(cursor, marker),
		);
		cursor = marker + EMPTY_HTML_COMMENT.length;
	}

	return result + code.slice(cursor);
}

/** Remove CMS paste hints from inline scripts so Vite can parse dev HTML. */
export function stripCmsHintsForDevHtml(html: string): string {
	let result = "";
	let cursor = 0;

	for (
		let marker = html.indexOf(CMS_HINT_START, cursor);
		marker !== -1;
		marker = html.indexOf(CMS_HINT_START, cursor)
	) {
		const markerEnd = html.indexOf(
			HTML_COMMENT_END,
			marker + CMS_HINT_START.length,
		);

		if (markerEnd === -1) {
			break;
		}

		result = appendWithoutTrailingWhitespace(
			result,
			html.slice(cursor, marker),
		);
		cursor = markerEnd + HTML_COMMENT_END.length;
	}

	return result + html.slice(cursor);
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
