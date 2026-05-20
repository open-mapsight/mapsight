import {selectExclusively} from "@mapsight/core/lib/feature-selections/actions";
import {memo, useCallback} from "react";
import {useDispatch} from "react-redux";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";

import getFeatureProperty from "../../helpers/get-feature-property";
import {search, selectSearchResult} from "../../store/actions";

function SearchResultEntry({closeSearch, onReturnFocus, feature}) {
	const dispatch = useDispatch();

	const name = getFeatureProperty(feature, "name");
	const listInformation = getFeatureProperty(feature, "listInformation");
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
