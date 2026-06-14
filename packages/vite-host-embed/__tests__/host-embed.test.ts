import path from "node:path";

import {describe, expect, it} from "vitest";

import {
	type HostEmbedConfig,
	buildHtaccess,
	buildSnippetsFromHtml,
	extractSnippetRegion,
	renderSnippetsReadme,
	rewriteCssUrlPaths,
	stripCmsHintsForDevHtml,
} from "../src";
import {stripHtmlCommentPlaceholdersFromScript} from "../src/extract-snippets.ts";

const baseConfig: HostEmbedConfig = {
	assetsBase: "/mapsight-assets",
	runtimeEntry: "embed",
	appStylesheet: "mapsight.css",
	embedTypeEntries: {
		simpleMap: "entries/simpleMap.ts",
	},
	snippetSources: [{name: "simple", file: "simple.html"}],
};

describe("rewriteCssUrlPaths", () => {
	it("rewrites absolute /img/ URLs to the deploy prefix", () => {
		const css = ".icon { background: url(/img/mapsight-icons/info.svg); }";
		expect(rewriteCssUrlPaths(css, "/mapsight-assets")).toBe(
			".icon { background: url(/mapsight-assets/img/mapsight-icons/info.svg); }",
		);
	});
});

describe("buildHtaccess", () => {
	it("includes rewrite base and cache headers for stable entries", () => {
		const htaccess = buildHtaccess(baseConfig);

		expect(htaccess).toContain("RewriteBase /mapsight-assets/");
		expect(htaccess).not.toContain("RewriteRule ^snippets/");
		expect(htaccess).toContain('<FilesMatch "^(simpleMap|embed)\\.js$">');
		expect(htaccess).toContain('<FilesMatch "^mapsight\\.css$">');
	});
});

describe("renderSnippetsReadme", () => {
	it("points to dist/snippets and integration docs", () => {
		const readme = renderSnippetsReadme(baseConfig);

		expect(readme).toContain("dist/snippets");
		expect(readme).toContain("dist/mapsight-assets");
		expect(readme).toContain("CMS_PHP.md");
		expect(readme).toContain("CMS_EDITORS.md");
	});
});

describe("extractSnippetRegion", () => {
	it("extracts marked HTML and strips dev-only blocks", () => {
		const source = `<!-- mapsight:snippet:start -->
<div id="demo"></div>
<!-- mapsight:dev-only -->
<nav>dev</nav>
<!-- /mapsight:dev-only -->
<!-- mapsight:snippet:end -->`;

		expect(extractSnippetRegion(source, "index.html")).toBe(
			'<div id="demo"></div>',
		);
	});
});

describe("stripHtmlCommentPlaceholdersFromScript", () => {
	it("removes Vite dep-scan HTML comment placeholders from inline script code", () => {
		const code = `simpleMap({
	imagesUrl: "/mapsight-assets/img/", <!---->
	featureSourceUrl: "/mapsight-assets/data/demo.geojson", <!---->
});`;

		expect(stripHtmlCommentPlaceholdersFromScript(code)).toBe(`simpleMap({
	imagesUrl: "/mapsight-assets/img/",
	featureSourceUrl: "/mapsight-assets/data/demo.geojson",
});`);
	});
});

describe("stripCmsHintsForDevHtml", () => {
	it("removes inline CMS hints from script blocks", () => {
		const html = `<script>
simpleMap({
	imagesUrl: "/mapsight-assets/img/", <!-- mapsight:cms:replace imagesUrl -->
});
</script>`;

		expect(stripCmsHintsForDevHtml(html)).toBe(`<script>
simpleMap({
	imagesUrl: "/mapsight-assets/img/",
});
</script>`);
	});
});

describe("buildSnippetsFromHtml", () => {
	it("reads snippet markers from configured HTML files", () => {
		const appRoot = path.join(import.meta.dirname, "fixtures");
		const snippets = buildSnippetsFromHtml(appRoot, {
			...baseConfig,
			snippetSources: [{name: "simple", file: "simple.html"}],
		});

		expect(snippets.simple?.contents).toContain("mapsight-embed-demo");
		expect(snippets.simple?.contents).toContain(
			"/mapsight-assets/assets/embed.js",
		);
	});
});
