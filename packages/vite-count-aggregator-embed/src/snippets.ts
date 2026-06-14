/** Strip Vite HTML shell noise after a production app-shell build. */
export function stripBuiltHtmlShell(html: string): string {
	return stripLeadingMetaCharset(stripLeadingDoctype(html)).trim();
}

function stripLeadingDoctype(html: string): string {
	const doctype = "<!doctype html>";

	if (!html.slice(0, doctype.length).toLowerCase().startsWith(doctype)) {
		return html;
	}

	return html.slice(doctype.length).trimStart();
}

function stripLeadingMetaCharset(html: string): string {
	const prefix = "<meta charset";

	if (!html.slice(0, prefix.length).toLowerCase().startsWith(prefix)) {
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
