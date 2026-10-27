import {type CheckContext, reportRule} from "./context.ts";

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Returns the lexicon entry a UI string matches. Multi-word entries match as
 * a phrase anywhere; single words only match the whole string, so data such
 * as "Open Air Kino" is not flagged.
 */
export function matchLexicon(
	text: string,
	lexicon: string[],
): string | undefined {
	let normalized = text.replace(/\s+/g, " ").trim().toLowerCase();
	// trailing punctuation ("Suche …", "Loading list…"), trimmed without a
	// backtracking regular expression
	while (/[\s.…:]/u.test(normalized.at(-1) ?? "")) {
		normalized = normalized.slice(0, -1);
	}
	if (!normalized) {
		return undefined;
	}
	for (const entry of lexicon) {
		const phrase = entry.toLowerCase();
		if (!phrase.includes(" ")) {
			if (normalized === phrase) {
				return entry;
			}
			continue;
		}
		if (
			new RegExp(
				`(^|[^\\p{L}])${escapeRegExp(phrase)}([^\\p{L}]|$)`,
				"u",
			).test(normalized)
		) {
			return entry;
		}
	}
	return undefined;
}

/** UI strings (names, labels, titles, placeholders) in the page language? */
export async function languageCheck(context: CheckContext): Promise<void> {
	const collected = await context.page.evaluate(() => {
		const api = window.__mapsightA11y!;
		const root = api.root();
		if (!root) {
			return null;
		}
		const pageLanguage = document.documentElement.lang;
		const attributes = [
			"aria-label",
			"title",
			"placeholder",
			"alt",
			"aria-description",
			"aria-roledescription",
			"aria-valuetext",
		];
		const textElements =
			'button, a[href], [role="button"], [role="tab"], [role="menuitem"], label, legend, summary, option, h1, h2, h3, h4, h5, h6, th';
		const seen = new Set<string>();
		const strings: Array<{
			text: string;
			source: string;
			language: string;
			info: {selector: string; html: string; owner: string};
		}> = [];
		const scope = [root, ...root.querySelectorAll("*")];
		for (const element of scope) {
			const language =
				element.closest("[lang]")?.getAttribute("lang") ?? pageLanguage;
			const add = (text: string | null, source: string) => {
				const value = (text ?? "").replace(/\s+/g, " ").trim();
				if (!value || value.length > 120) {
					return;
				}
				const info = api.describe(element);
				const key = `${value}|${info.selector}`;
				if (seen.has(key)) {
					return;
				}
				seen.add(key);
				strings.push({text: value, source, language, info});
			};
			for (const attribute of attributes) {
				if (element.hasAttribute(attribute)) {
					add(element.getAttribute(attribute), attribute);
				}
			}
			if (element.matches(textElements) && api.isVisible(element)) {
				add((element as HTMLElement).innerText, "text");
			}
		}
		return {pageLanguage, strings};
	});
	if (!collected) {
		return;
	}
	const expected = (context.target.language ?? collected.pageLanguage ?? "")
		.toLowerCase()
		.split("-")[0];
	if (!expected || expected === "en") {
		return;
	}
	for (const entry of collected.strings) {
		if (entry.language.toLowerCase().startsWith("en")) {
			continue;
		}
		const match = matchLexicon(entry.text, context.config.englishLexicon);
		if (match) {
			reportRule(
				context,
				"language/untranslated",
				{...entry.info, name: entry.text},
				`${entry.source} "${entry.text}" is English UI text (matches "${match}") on a page in "${expected}".`,
			);
		}
	}
}
