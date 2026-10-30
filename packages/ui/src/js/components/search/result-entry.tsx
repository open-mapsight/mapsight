import type {ReactNode} from "react";
import {memo, useCallback} from "react";
import {useDispatch} from "react-redux";

import {selectExclusively} from "@mapsight/core/lib/feature-selections/actions";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import getFeatureProperty from "../../helpers/get-feature-property";
import {search, selectSearchResult} from "../../store/actions";
import type {MapsightUiFeature, MapsightUiStore} from "../../types";

export type SearchResultEntryProps = {
	closeSearch?: () => void;
	onReturnFocus: () => void;
	onResultSelected?: (feature: MapsightUiFeature) => void;
	feature: MapsightUiFeature;
};

function SearchResultEntry({
	closeSearch,
	onReturnFocus,
	onResultSelected,
	feature,
}: SearchResultEntryProps) {
	const dispatch = useDispatch<MapsightUiStore["dispatch"]>();

	const name = getFeatureProperty(feature, "name") as string;
	const listInformation = getFeatureProperty(
		feature,
		"listInformation",
	) as ReactNode;
	const isIncompleteSuggest =
		getFeatureProperty(feature, "isIncompleteSuggest") === true;

	const handleClick = useCallback(() => {
		if (isIncompleteSuggest) {
			dispatch(search(name.trim() + " "));
			onReturnFocus();
		} else {
			dispatch(selectSearchResult(feature));
			dispatch(
				selectExclusively(
					FEATURE_SELECTIONS,
					FEATURE_SELECTION_SELECT,
					feature.id,
				),
			);

			onResultSelected?.(feature);

			if (closeSearch) {
				closeSearch();
			}
		}
	}, [
		dispatch,
		feature,
		isIncompleteSuggest,
		name,
		onReturnFocus,
		onResultSelected,
		closeSearch,
	]);

	return (
		<li className="ms3-search-result__list-item">
			<button
				className="ms3-search-result__entry"
				type="button"
				onClick={handleClick}
			>
				<div className="ms3-search-result__entry__title">{name}</div>
				{listInformation && (
					<div className="ms3-search-result__entry__subline">
						{listInformation}
					</div>
				)}
			</button>
		</li>
	);
}

export default memo(SearchResultEntry);
