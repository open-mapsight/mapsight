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
