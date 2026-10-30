import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {
	collectHeadingAnchors,
	extractMarkdownHrefs,
	githubHeadingSlug,
} from "./check-markdown-links.mts";

describe("githubHeadingSlug", () => {
	it("slugifies MapsightUI-style headings", () => {
		assert.equal(
			githubHeadingSlug("Quick start with `@mapsight/ui`"),
			"quick-start-with-mapsightui",
		);
	});

	it("strips punctuation and keeps double hyphens from removed chars", () => {
		assert.equal(githubHeadingSlug("Hello, World!"), "hello-world");
		assert.equal(
			githubHeadingSlug("Monorepo / pnpm workspace"),
			"monorepo--pnpm-workspace",
		);
		assert.equal(
			githubHeadingSlug(
				"Primitive preference for new / migrated UI chrome",
			),
			"primitive-preference-for-new--migrated-ui-chrome",
		);
	});
});

describe("collectHeadingAnchors", () => {
	it("assigns duplicate suffixes like GitHub", () => {
		const anchors = collectHeadingAnchors(
			"# Title\n\n## Dup\n\n## Dup\n\n## Dup\n",
		);
		assert.deepEqual([...anchors].sort(), [
			"dup",
			"dup-1",
			"dup-2",
			"title",
		]);
	});

	it("uses link label text for linked headings", () => {
		const anchors = collectHeadingAnchors(
			"## See [GIS stack](../ecosystem/GIS_STACK_CHOICES.md)\n",
		);
		assert.ok(anchors.has("see-gis-stack"));
	});
});

describe("extractMarkdownHrefs", () => {
	it("finds links and images with line numbers", () => {
		const hits = extractMarkdownHrefs(
			"Intro\n\nSee [docs](./a.md#x) and ![img](./b.png).\n",
		);
		assert.deepEqual(hits, [
			{href: "./a.md#x", line: 3},
			{href: "./b.png", line: 3},
		]);
	});
});
