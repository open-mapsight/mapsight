import getFeatureProperty from "../../helpers/get-feature-property";
import type {MapsightUiFeature, MapsightUiFeatureProperty} from "../../types";

/**
 * Resolve raw list-row HTML from feature properties (`overrideListHtml` /
 * `__overrideListHtmlProp`).
 *
 * @deprecated Pre-OSS host escape hatch: HTML baked into GeoJSON/CMS features,
 *   then rendered with `dangerouslySetInnerHTML` and a wrapper `role="button"`
 *   (same class of a11y smell as “`<a>` as button”). Prefer a typed `itemAs`
 *   row and/or default FeatureListItem + FeatureSelectButton. Removed in the
 *   next major of `@mapsight/ui`.
 */
export default function getLegacyOverrideListHtml(
	feature: MapsightUiFeature,
): string | undefined {
	const overrideListHtmlPropertyRaw = getFeatureProperty(
		feature,
		"__overrideListHtmlProp",
		"overrideListHtml",
	);
	const overrideListHtmlProperty = (
		typeof overrideListHtmlPropertyRaw === "string" &&
		overrideListHtmlPropertyRaw.length > 0
			? overrideListHtmlPropertyRaw
			: "overrideListHtml"
	) as MapsightUiFeatureProperty;
	const overrideListHtmlRaw = getFeatureProperty(
		feature,
		overrideListHtmlProperty,
	);
	return typeof overrideListHtmlRaw === "string" &&
		overrideListHtmlRaw.length > 0
		? overrideListHtmlRaw
		: undefined;
}
