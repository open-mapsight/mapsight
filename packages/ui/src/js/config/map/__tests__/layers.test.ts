import {describe, expect, it} from "vitest";

import {metaDataWithAttribution, metaDataWithAttributionHtml} from "../layers";

describe("attribution metadata helpers", () => {
	it("sets the explicit HTML field without touching other fields", () => {
		const base = {title: "Streets", attribution: "Streets contributors"};
		expect(metaDataWithAttributionHtml(base, "<b>Streets</b>")).toEqual({
			...base,
			dangerouslySetAttributionHtml: "<b>Streets</b>",
		});
		expect(base).toEqual({
			title: "Streets",
			attribution: "Streets contributors",
		});
	});

	it("defaults to empty metadata and composes with the text helper", () => {
		expect(metaDataWithAttributionHtml(undefined, "<i>x</i>")).toEqual({
			dangerouslySetAttributionHtml: "<i>x</i>",
		});
		expect(
			metaDataWithAttributionHtml(
				metaDataWithAttribution({}, "plain"),
				"<i>rich</i>",
			),
		).toEqual({
			attribution: "plain",
			dangerouslySetAttributionHtml: "<i>rich</i>",
		});
	});
});
