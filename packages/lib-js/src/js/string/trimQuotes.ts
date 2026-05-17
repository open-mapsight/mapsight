const RE_TRIM_QUOTES = /^['"](.*)['"]$/;

export default function trimQuotes(a: string): string {
	return a.replace(RE_TRIM_QUOTES, "$1");
}
