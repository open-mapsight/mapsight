import {globSync, readFileSync} from "node:fs";
import {resolve} from "node:path";

import {afterEach, expect, it, vi} from "vitest";

import {
	getDictionary,
	registerTranslations,
	setDocumentLanguage,
	translate,
} from "./index";

afterEach(() => {
	document.documentElement.lang = "";
	setDocumentLanguage("de");
	delete getDictionary()["en-GB"];
});

it("keeps the default locale independent of browser document language", async () => {
	document.documentElement.lang = "en";
	vi.resetModules();
	const {getDocumentLanguage, setDocumentLanguage, translate} =
		await import("./index");
	expect(getDocumentLanguage()).toBe("de");
	expect(translate("show")).toBe("anzeigen");
	setDocumentLanguage("en");
	expect(getDocumentLanguage()).toBe("en");
});

it("falls back from regional locales to the base language", () => {
	setDocumentLanguage("en-GB");
	expect(translate("shareLink")).toBe("Share link");
	expect(translate("marker", "EN_us")).toBe("Marker");
});

it("prefers exact host translations, then the base language, German and the raw key", () => {
	registerTranslations({"en-GB": {shareLink: "Share this link"}});
	expect(translate("shareLink", "en-GB")).toBe("Share this link");
	expect(translate("marker", "en-GB")).toBe("Marker");
	expect(translate("shareLink", "fr-FR")).toBe("Link teilen");
	expect(translate("unknown.translation", "fr")).toBe("unknown.translation");
});

it("provides German and English for every translate literal in the UI package", () => {
	const root = resolve(process.cwd(), "src/js");
	// Registered at runtime by the measure-distance plugin, not the shared dictionaries.
	const allowedMissing = new Set([
		"ui.measure-distance.measurement",
		"ui.measure-distance.title",
	]);
	const missing: string[] = [];
	for (const path of globSync("**/*.{js,jsx,ts,tsx}", {cwd: root})) {
		if (path.includes(".test.") || path.includes("__tests__")) continue;
		const source = readFileSync(`${root}/${path}`, "utf8");
		for (const match of source.matchAll(
			/\btranslate\(\s*(["'])([^"']+)\1\s*[,)]/g,
		)) {
			const key = match[2]!;
			if (allowedMissing.has(key)) continue;
			for (const [language, dictionary] of Object.entries(
				getDictionary(),
			).filter(([language]) => language === "de" || language === "en")) {
				if (!Object.hasOwn(dictionary, key))
					missing.push(`${language}: ${key} (${path})`);
			}
		}
	}
	expect(missing).toEqual([]);
});
