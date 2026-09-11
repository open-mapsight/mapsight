import {describe, expect, it} from "vitest";

import {extractStateFromFragment, normalizeRenderResult} from "./v1.ts";

describe("extractStateFromFragment", () => {
	it("reads single-quoted entity-encoded JSON", () => {
		const attribution =
			'<a href="https://www.openstreetmap.org/copyright" rel="external" target="_blank">OpenStreetMap contributors</a>.';
		const state = {map: {layers: {street: {attribution}}}};
		const encoded = JSON.stringify(state)
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/</g, "&lt;");
		const html = `<div id="t" class="mapsight-embed" data-dehydrated-state='${encoded}'><!--$--></div>`;

		expect(extractStateFromFragment(html)).toEqual(state);
	});
});

describe("normalizeRenderResult", () => {
	it("uses fragment state instead of the sidecar stub", () => {
		const state = {map: {show: true}, app: {title: "City map"}};
		const encoded = JSON.stringify(state).replace(/"/g, "&quot;");
		const html = `<div id="t" data-dehydrated-state='${encoded}'></div>`;

		expect(normalizeRenderResult(html, {preset: "simpleMap"})).toEqual({
			html,
			state,
		});
	});
});
