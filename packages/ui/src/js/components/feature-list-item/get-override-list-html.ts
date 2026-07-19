import getFeatureProperty from "../../helpers/get-feature-property";
import type {MapsightUiFeature, MapsightUiFeatureProperty} from "../../types";

/** Resolve legacy host list HTML from feature properties, if present. */
export default function getOverrideListHtml(
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
