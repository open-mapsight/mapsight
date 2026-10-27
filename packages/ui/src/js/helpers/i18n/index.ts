// TODO: https://www.npmjs.com/package/i18next ?
import de from "./de";
import en from "./en";

const DEFAULT_LANGUAGE = "de";
// Never derive first-render text from the browser document or runtime locale.
// Hosts choose the same language on both sides via the lang plugin or setter.
let documentLanguage = DEFAULT_LANGUAGE;

const DICTIONARY: Record<string, Record<string, string>> = {de, en};

// use this to make dictionary expandable/overwritable by clients
export function getDictionary() {
	return DICTIONARY;
}

/**
 * Merge host/app translation catalogs into the shared UI dictionary.
 *
 * Later keys overwrite earlier ones for the same language. Prefer calling this
 * once during app bootstrap rather than mutating `getDictionary()` ad hoc.
 */
export function registerTranslations(
	messages: Record<string, Record<string, string>>,
) {
	for (const [language, languageTranslations] of Object.entries(messages)) {
		DICTIONARY[language] = {
			...DICTIONARY[language],
			...languageTranslations,
		};
	}
}

export function setDocumentLanguage(value) {
	documentLanguage = value;
}

export function getDocumentLanguage() {
	return documentLanguage;
}

/**
 * @param key key
 * @param language language
 * @returns translation
 */
export function translate(
	key: string,
	language: string = documentLanguage,
): string {
	return (
		DICTIONARY[language]?.[key] ??
		DICTIONARY[language.toLowerCase().replaceAll("_", "-")]?.[key] ??
		DICTIONARY[
			language.toLowerCase().split(/[-_]/)[0] ?? DEFAULT_LANGUAGE
		]?.[key] ??
		DICTIONARY[DEFAULT_LANGUAGE]?.[key] ??
		key
	);
}
