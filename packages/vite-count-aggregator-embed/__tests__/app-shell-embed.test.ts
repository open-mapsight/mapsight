import {describe, expect, it} from "vitest";

import {renderAppShellSnippetDocument, stripBuiltHtmlShell} from "../src";

describe("stripBuiltHtmlShell", () => {
	it("removes doctype and charset from built HTML", () => {
		const html = `<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="/count-aggregator/assets/app.css">
<div id="root"></div>`;

		expect(stripBuiltHtmlShell(html)).toBe(
			'<link rel="stylesheet" href="/count-aggregator/assets/app.css">\n<div id="root"></div>',
		);
	});
});

describe("renderAppShellSnippetDocument", () => {
	it("wraps built markup with a CMS paste header", () => {
		const snippet = renderAppShellSnippetDocument(
			"Mapsight count-aggregator CMS embed",
			"/count-aggregator",
			'<div id="root"></div>',
		);

		expect(snippet).toContain("Mapsight count-aggregator CMS embed");
		expect(snippet).toContain("/count-aggregator/");
		expect(snippet).toContain('<div id="root"></div>');
	});
});
