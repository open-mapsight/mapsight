const DEFAULT_DEHYDRATED_STATE_ATTRIBUTE = "data-dehydrated-state";
const DATA_ATTRIBUTE_NAME = /^data-[a-z][\w-]*$/i;

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
		attributeName = DEFAULT_DEHYDRATED_STATE_ATTRIBUTE,
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

	const safeAttributeName = DATA_ATTRIBUTE_NAME.test(attributeName)
		? attributeName
		: DEFAULT_DEHYDRATED_STATE_ATTRIBUTE;

	return `<div id="${escapeHtmlAttribute(id)}"${classAttr} ${safeAttributeName}='${escapedState}'>${html}</div>`;
}

function escapeHtmlAttribute(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("'", "&#39;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;");
}
