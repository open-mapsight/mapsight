import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {describe, expect, it} from "vitest";

import {
	type HostEmbedConfig,
	buildHtaccess,
	buildSnippetsFromHtml,
	extractSnippetRegion,
	finalizeAppStylesheet,
	finalizeEntryModules,
	renderScriptSafeCmsHintsInHtml,
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

describe("finalizeAppStylesheet", () => {
	it("keeps the hashed app stylesheet and writes a stable import wrapper", async () => {
		const assetsDir = await fs.mkdtemp(
			path.join(os.tmpdir(), "mapsight-host-embed-"),
		);

		try {
			await fs.writeFile(
				path.join(assetsDir, "mapsight-host-abc12345.css"),
				".app{color:red}",
				"utf8",
			);
			await fs.writeFile(
				path.join(assetsDir, "other-def67890.css"),
				".other{color:blue}",
				"utf8",
			);

			await finalizeAppStylesheet(assetsDir, {
				...baseConfig,
				appStylesheetPrefix: "mapsight-host",
			});

			await expect(
				fs.readFile(
					path.join(assetsDir, "mapsight-host-abc12345.css"),
					"utf8",
				),
			).resolves.toBe(".app{color:red}");
			await expect(
				fs.readFile(path.join(assetsDir, "mapsight.css"), "utf8"),
			).resolves.toBe('@import "./mapsight-host-abc12345.css";\n');
			await expect(
				fs.access(path.join(assetsDir, "other-def67890.css")),
			).rejects.toThrow();
		} finally {
			await fs.rm(assetsDir, {recursive: true, force: true});
		}
	});
});

describe("finalizeEntryModules", () => {
	it("keeps hashed entry modules and writes stable re-export wrappers", async () => {
		const assetsDir = await fs.mkdtemp(
			path.join(os.tmpdir(), "mapsight-host-embed-"),
		);

		try {
			await fs.writeFile(
				path.join(assetsDir, "embed.js"),
				"export default function browserEmbed() {}\n",
				"utf8",
			);
			await fs.writeFile(
				path.join(assetsDir, "simpleMap.js"),
				"export function simpleMap() {}\n",
				"utf8",
			);

			await finalizeEntryModules(assetsDir, baseConfig);

			const entries = await fs.readdir(assetsDir);
			const hashedEmbed = entries.find((name) =>
				/^embed-[a-zA-Z0-9_-]{8}\.js$/.test(name),
			);
			const hashedSimpleMap = entries.find((name) =>
				/^simpleMap-[a-zA-Z0-9_-]{8}\.js$/.test(name),
			);

			expect(hashedEmbed).toBeDefined();
			expect(hashedSimpleMap).toBeDefined();
			await expect(
				fs.readFile(path.join(assetsDir, hashedEmbed!), "utf8"),
			).resolves.toBe("export default function browserEmbed() {}\n");
			await expect(
				fs.readFile(path.join(assetsDir, hashedSimpleMap!), "utf8"),
			).resolves.toBe("export function simpleMap() {}\n");
			await expect(
				fs.readFile(path.join(assetsDir, "embed.js"), "utf8"),
			).resolves.toBe(
				`export * from "./${hashedEmbed}";\nexport {default} from "./${hashedEmbed}";\n`,
			);
			await expect(
				fs.readFile(path.join(assetsDir, "simpleMap.js"), "utf8"),
			).resolves.toBe(`export * from "./${hashedSimpleMap}";\n`);
		} finally {
			await fs.rm(assetsDir, {recursive: true, force: true});
		}
	});

	it("can write named-only wrappers for all entries", async () => {
		const assetsDir = await fs.mkdtemp(
			path.join(os.tmpdir(), "mapsight-host-embed-"),
		);

		try {
			await fs.writeFile(
				path.join(assetsDir, "embed.js"),
				"export function mountEmbed() {}\n",
				"utf8",
			);
			await fs.writeFile(
				path.join(assetsDir, "simpleMap.js"),
				"export function simpleMap() {}\n",
				"utf8",
			);

			await finalizeEntryModules(assetsDir, {
				...baseConfig,
				defaultEntryExports: [],
			});

			const entries = await fs.readdir(assetsDir);
			const hashedEmbed = entries.find((name) =>
				/^embed-[a-zA-Z0-9_-]{8}\.js$/.test(name),
			);

			expect(hashedEmbed).toBeDefined();
			await expect(
				fs.readFile(path.join(assetsDir, "embed.js"), "utf8"),
			).resolves.toBe(`export * from "./${hashedEmbed}";\n`);
		} finally {
			await fs.rm(assetsDir, {recursive: true, force: true});
		}
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

	it("renders CMS hints inside scripts as JavaScript comments", () => {
		const source = `<!-- mapsight:snippet:start -->
<p><!-- mapsight:cms:replace text --></p>
<script type="module">
simpleMap({
	imagesUrl: "/mapsight-assets/img/", <!-- mapsight:cms:replace imagesUrl -->
});
</script>
<!-- mapsight:snippet:end -->`;

		expect(extractSnippetRegion(source, "index.html"))
			.toBe(`<p><!-- mapsight:cms:replace text --></p>
<script type="module">
simpleMap({
	imagesUrl: "/mapsight-assets/img/", // mapsight:cms:replace imagesUrl
});
</script>`);
	});
});

describe("renderScriptSafeCmsHintsInHtml", () => {
	it("only rewrites CMS hint comments inside script blocks", () => {
		const html = `<p><!-- mapsight:cms:replace text --></p>
<script>
value, <!-- mapsight:cms:replace value -->
</script>`;

		expect(renderScriptSafeCmsHintsInHtml(html))
			.toBe(`<p><!-- mapsight:cms:replace text --></p>
<script>
value, // mapsight:cms:replace value
</script>`);
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
