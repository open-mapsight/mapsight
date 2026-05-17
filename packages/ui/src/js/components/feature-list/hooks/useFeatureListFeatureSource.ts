import {useMemo} from "react";
import {useSelector} from "react-redux";

import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";

import {FEATURE_LIST} from "../../../config/constants/controllers";
import {createFeatureSourceSelector} from "../../../store/selectors";

// TODO: type out feature source state (probably in @mapsight/core)
/**
 * @param {string} listControllerName listControllerName
 * @returns {{featureSource: object, featureSourceId: string}} featureSource
 */
export default function useFeatureListFeatureSource(
	listControllerName = FEATURE_LIST,
): {featureSourceId?: string; featureSource?: FeatureSourceState} {
	const selector = useMemo(
		() => createFeatureSourceSelector(listControllerName),
		[listControllerName],
	);
	return useSelector(selector);
}
