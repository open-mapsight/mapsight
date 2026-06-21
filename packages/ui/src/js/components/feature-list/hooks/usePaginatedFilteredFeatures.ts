import {useMemo} from "react";
import {useSelector} from "react-redux";

import {getAllFeatures} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";

import getFeatureProperty from "../../../helpers/get-feature-property";
import sortFeaturesByDistance from "../../../helpers/sort-features-by-distance";
import {
	type RootStateSlice,
	listFilterOptionsSelector,
	listPageSelector,
} from "../../../store/selectors";
import type {
	FullUiState,
	MapsightUiFeature,
	MapsightUiFeatureProperty,
} from "../../../types";

export type PaginatedFilteredFeaturesState = {
	features: MapsightUiFeature[];
	filteredFeatures: MapsightUiFeature[];
	page: number;
	featureCount: number;
};

function filterByQueries(queries: Array<string>, feature: MapsightUiFeature) {
	// TODO: This list of properties should be configurable!
	const properties: MapsightUiFeatureProperty[] = [
		"name",
		"listName",
		"listInformation",
	];

	const values = properties
		.map((key) => getFeatureProperty(feature, key))
		.filter((val) => !!val)
		.map((val: string) => val.toLowerCase());

	return queries.every((query) =>
		values.some((value) => value.indexOf(query) !== -1),
	);
}

export function filterFeatures(
	query: string | null,
	features: Array<MapsightUiFeature>,
) {
	const queries = (query || "").trim().toLowerCase().split(/\s+/g);

	if (queries.length === 0 || (queries.length === 1 && queries[0] === "")) {
		return features;
	}

	return features.filter((feature) => filterByQueries(queries, feature));
}

function paginateFeatures(
	features: Array<MapsightUiFeature>,
	page: number,
	itemsPerPage: number,
) {
	const offsetStart = page * itemsPerPage;
	const offsetEnd = offsetStart + itemsPerPage;

	return features.slice(offsetStart, offsetEnd);
}

export default function usePaginatedFilteredFeatures(
	featureSource: FeatureSourceState | undefined,
	featureSourceId: string | undefined,
	listUiOptions: Pick<
		FullUiState["list"],
		"itemsPerPage" | "paginationControl"
	>,
	sort = true,
	filter = true,
) {
	const {itemsPerPage, paginationControl} = listUiOptions;
	const page = useSelector(listPageSelector);
	const {query, places, sorting} = useSelector((state: RootStateSlice) =>
		listFilterOptionsSelector(state, featureSourceId),
	);

	return useMemo((): PaginatedFilteredFeaturesState => {
		if (!featureSource) {
			return {
				features: [],
				filteredFeatures: [],
				featureCount: 0,
				page: 0,
			};
		}

		const features = getAllFeatures(featureSource) as MapsightUiFeature[];

		// 1. filter
		const filteredFeatures = filter
			? filterFeatures(query ?? null, features)
			: features;

		// get (total) feature count after filtering, but _before_ paging
		const featureCount = filteredFeatures.length;

		// 2. sort
		const sortedFeatures = sort
			? sortFeaturesByDistance(filteredFeatures, places, sorting)
			: features;

		// 3. paginate
		const paginatedFeatures =
			paginationControl && itemsPerPage
				? paginateFeatures(sortedFeatures, page, itemsPerPage)
				: sortedFeatures;

		return {
			features,
			filteredFeatures: paginatedFeatures,
			featureCount,
			page,
		};
	}, [
		featureSource,
		featureSourceId,
		filter,
		query,
		sort,
		places,
		sorting,
		paginationControl,
		page,
		itemsPerPage,
	]);
}
