// TODO: https://www.npmjs.com/package/i18next ?
import de from "./de";
import en from "./en";

const DEFAULT_LANGUAGE = "de";
let documentLanguage =
	(typeof document !== "undefined" &&
		document.documentElement &&
		document.documentElement.lang) ||
	DEFAULT_LANGUAGE;

const DICTIONARY: Record<string, Record<string, string>> = {de, en};

// use this to make dictionary expandable/overwritable by clients
export function getDictionary() {
	return DICTIONARY;
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
		DICTIONARY[DEFAULT_LANGUAGE]?.[key] ??
		key
	);
}
