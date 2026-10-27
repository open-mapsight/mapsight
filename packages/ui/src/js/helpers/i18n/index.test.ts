import {afterEach, expect, it, vi} from "vitest";

afterEach(() => {
	document.documentElement.lang = "";
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
