import {describe, expect, it} from "vitest";

import {wrapEmbedFragment} from "./emit-fragment";

describe("wrapEmbedFragment", () => {
	it("emits a container with shell html and dehydrated state attribute", () => {
		const fragment = wrapEmbedFragment({
			id: "mapsight-embed-1",
			html: "<section>shell</section>",
			dehydratedState: {app: {title: "from-ssr"}},
		});

		expect(fragment).toContain('id="mapsight-embed-1"');
		expect(fragment).toContain('class="mapsight-embed"');
		expect(fragment).toContain("data-dehydrated-state='");
		expect(fragment).toContain("from-ssr");
		expect(fragment).toContain("<section>shell</section>");
		expect(fragment.endsWith("</div>")).toBe(true);
	});

	it("keeps a valid custom data-* attribute name", () => {
		const fragment = wrapEmbedFragment({
			id: "e",
			html: "",
			dehydratedState: {ok: true},
			attributeName: "data-mapsight-state",
		});

		expect(fragment).toContain("data-mapsight-state='");
		expect(fragment).not.toContain("data-dehydrated-state='");
	});

	it("falls back to data-dehydrated-state when attributeName is not a data-* name", () => {
		const fragment = wrapEmbedFragment({
			id: "e",
			html: "",
			dehydratedState: {ok: true},
			attributeName: `onclick="alert(1)" data-x`,
		});

		expect(fragment).toContain("data-dehydrated-state='");
		expect(fragment).not.toContain("onclick=");
	});

	it("escapes quotes in dehydrated JSON for a safe attribute", () => {
		const fragment = wrapEmbedFragment({
			id: "e",
			html: "",
			dehydratedState: {app: {title: "O'Reilly"}},
		});

		expect(fragment).toContain("&#39;");
		expect(fragment).not.toMatch(/data-dehydrated-state='[^']*O'Reilly/);
	});
});
