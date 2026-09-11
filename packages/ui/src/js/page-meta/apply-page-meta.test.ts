import {afterEach, describe, expect, it} from "vitest";

import {
	PAGE_JSON_LD_SCRIPT_ID,
	applyPageMetaToDocument,
	documentTitleForMeta,
} from "./apply-page-meta";
import type {PageMeta} from "./types";

const defaults = {
	title: "Stadtplan | Beispielstadt",
	siteName: "Beispielstadt",
	canonicalUrl: "https://www.example.de/plan/index.php",
	ogImage: "https://www.example.de/plan/img/og-default.png",
	description: "Der Stadtplan der Beispielstadt.",
};

const placeMeta: PageMeta = {
	title: "Rathaus",
	description: "Das Rathaus ist täglich geöffnet.",
	canonicalUrl: "https://www.example.de/plan/?feature=rathaus",
	og: {
		title: "Rathaus",
		description: "Das Rathaus ist täglich geöffnet.",
		url: "https://www.example.de/plan/?feature=rathaus",
		type: "place",
		image: "https://www.example.de/plan/img/og-default.png",
	},
	jsonLd: {
		"@context": "https://schema.org",
		"@type": "Place",
		name: "Rathaus",
	},
};

const moduleMeta: PageMeta = {
	title: "Parken",
	description: "Parkplätze in der Beispielstadt.",
	canonicalUrl: "https://www.example.de/plan/?module=parken",
	og: {
		title: "Parken",
		description: "Parkplätze in der Beispielstadt.",
		url: "https://www.example.de/plan/?module=parken",
		type: "website",
		image: "https://www.example.de/plan/img/og-default.png",
	},
	jsonLd: {
		"@context": "https://schema.org",
		"@type": "WebPage",
		name: "Parken",
	},
};

afterEach(() => {
	document.head.innerHTML = "";
	document.title = "";
});

describe("documentTitleForMeta", () => {
	it("appends the site name once", () => {
		expect(documentTitleForMeta("Parken", defaults)).toBe(
			"Parken | Beispielstadt",
		);
		expect(documentTitleForMeta("Parken | Beispielstadt", defaults)).toBe(
			"Parken | Beispielstadt",
		);
	});

	it("restores the article title when meta is missing", () => {
		expect(documentTitleForMeta(null, defaults)).toBe(defaults.title);
	});
});

describe("applyPageMetaToDocument", () => {
	it("writes title, canonical, og tags, and JSON-LD in the head", () => {
		applyPageMetaToDocument(placeMeta, defaults);

		expect(document.title).toBe("Rathaus | Beispielstadt");
		expect(
			document
				.querySelector('link[rel="canonical"]')
				?.getAttribute("href"),
		).toBe(placeMeta.canonicalUrl);
		expect(
			document
				.querySelector('meta[property="og:type"]')
				?.getAttribute("content"),
		).toBe("place");
		expect(
			document.getElementById(PAGE_JSON_LD_SCRIPT_ID)?.textContent,
		).toContain('"@type":"Place"');
	});

	it("writes module website meta the same way", () => {
		applyPageMetaToDocument(moduleMeta, defaults);

		expect(document.title).toBe("Parken | Beispielstadt");
		expect(
			document
				.querySelector('link[rel="canonical"]')
				?.getAttribute("href"),
		).toBe(moduleMeta.canonicalUrl);
		expect(
			document
				.querySelector('meta[property="og:type"]')
				?.getAttribute("content"),
		).toBe("website");
		expect(
			document.getElementById(PAGE_JSON_LD_SCRIPT_ID)?.textContent,
		).toContain('"@type":"WebPage"');
	});

	it("restores article defaults and removes JSON-LD", () => {
		applyPageMetaToDocument(placeMeta, defaults);
		applyPageMetaToDocument(null, defaults);

		expect(document.title).toBe(defaults.title);
		expect(
			document
				.querySelector('meta[property="og:type"]')
				?.getAttribute("content"),
		).toBe("website");
		expect(
			document
				.querySelector('meta[property="og:title"]')
				?.getAttribute("content"),
		).toBe("Stadtplan");
		expect(
			document
				.querySelector('meta[property="og:description"]')
				?.getAttribute("content"),
		).toBe(defaults.description);
		expect(document.getElementById(PAGE_JSON_LD_SCRIPT_ID)).toBeNull();
	});

	it("removes leftover route tags when article defaults omit them", () => {
		const titleOnly = {title: defaults.title, siteName: defaults.siteName};
		applyPageMetaToDocument(placeMeta, titleOnly);
		applyPageMetaToDocument(null, titleOnly);

		expect(document.querySelector('link[rel="canonical"]')).toBeNull();
		expect(document.querySelector('meta[property="og:url"]')).toBeNull();
		expect(document.querySelector('meta[property="og:image"]')).toBeNull();
		expect(
			document.querySelector('meta[property="og:description"]'),
		).toBeNull();
	});
});
