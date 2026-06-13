/** Strip Vite HTML shell noise after a production app-shell build. */
export function stripBuiltHtmlShell(html: string): string {
	return html
		.replace(/<!doctype html>\s*/i, "")
		.replace(/<meta charset[^>]*>\s*/i, "")
		.trim();
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
