export type WrapEmbedFragmentOptions = {
	id: string;
	html: string;
	dehydratedState: unknown;
	className?: string;
	attributeName?: string;
};

/**
 * Build a CMS embed container fragment: shell HTML plus serializable
 * dehydrated state on a data attribute (see SSR_HYDRATION.md).
 */
export function wrapEmbedFragment(options: WrapEmbedFragmentOptions): string {
	const {
		id,
		html,
		dehydratedState,
		className = "mapsight-embed",
		attributeName = "data-dehydrated-state",
	} = options;

	const stateJson = JSON.stringify(dehydratedState);
	if (stateJson === undefined) {
		throw new Error(
			"mapsight ui: dehydrated state is not JSON-serializable",
		);
	}

	const escapedState = escapeHtmlAttribute(stateJson);
	const classAttr = className
		? ` class="${escapeHtmlAttribute(className)}"`
		: "";

	return `<div id="${escapeHtmlAttribute(id)}"${classAttr} ${attributeName}='${escapedState}'>${html}</div>`;
}

function escapeHtmlAttribute(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("'", "&#39;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;");
}
