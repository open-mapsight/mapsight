const DOCTYPE_HTML = "<!doctype html>";
const META_CHARSET_START = "<meta charset";

function startsWithIgnoreCase(value: string, prefix: string): boolean {
	return value.slice(0, prefix.length).toLowerCase() === prefix;
}

/** Strip Vite HTML shell noise after a production app-shell build. */
export function stripBuiltHtmlShell(html: string): string {
	return stripLeadingMetaCharset(stripLeadingDoctype(html)).trim();
}

function stripLeadingDoctype(html: string): string {
	if (!startsWithIgnoreCase(html, DOCTYPE_HTML)) {
		return html;
	}

	return html.slice(DOCTYPE_HTML.length).trimStart();
}

function stripLeadingMetaCharset(html: string): string {
	if (!startsWithIgnoreCase(html, META_CHARSET_START)) {
		return html;
	}

	const tagEnd = html.indexOf(">");

	if (tagEnd === -1) {
		return html;
	}

	return html.slice(tagEnd + 1).trimStart();
}

export function renderAppShellSnippetDocument(
	description: string,
	deployBase: string,
	bodyMarkup: string,
): string {
	return `<!--
${description}

Deploy app assets under ${deployBase}/. Script and stylesheet URLs below are from the latest build — regenerate after rebuild.
Paste into a CMS page that can host a full app shell (module script + stylesheet).
-->
${bodyMarkup}`;
}
