import type {ElementType} from "react";
import {memo} from "react";

export type FeatureListInfoHtmlProps = {
	as?: ElementType;
	html: string;
};

/**
 * Stable island for GeoJSON/CMS `listInformation` HTML.
 *
 * Highlight/select re-renders of the row must not recreate this host: React
 * would reset `innerHTML`, and host lazy-loaders (noscript unwrap) flash
 * contact pictures back in.
 */
function FeatureListInfoHtml({
	as: T = "span",
	html,
}: FeatureListInfoHtmlProps) {
	return (
		<T
			className="ms3-list__info"
			dangerouslySetInnerHTML={{__html: html}}
		/>
	);
}

export default memo(FeatureListInfoHtml);
