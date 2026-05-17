import {memo} from "react";
import {useSelector} from "react-redux";
import getFeatureProperty from "../../helpers/get-feature-property";
import {translate} from "../../helpers/i18n";

import {
	SEARCH_STATUS_EMPTY,
	SEARCH_STATUS_ERROR,
	SEARCH_STATUS_FOUND,
	SEARCH_STATUS_LOADING,
	searchResultFeaturesSelector,
	searchStatusSelector,
} from "../../store/selectors.ts";

import SearchResultEntry from "./result-entry";

const defaultGroup = "__default__";

function SearchResult({closeSearch, onReturnFocus}) {
	const status = useSelector(searchStatusSelector);
	const features = useSelector(searchResultFeaturesSelector);

	const groupedEntries = {};
	features.forEach((feature, i) => {
		const group = getFeatureProperty(feature, "group") || defaultGroup;
		groupedEntries[group] = groupedEntries[group] || [];
		groupedEntries[group].push(
			<SearchResultEntry
				key={feature.id || i}
				feature={feature}
				closeSearch={closeSearch}
				onReturnFocus={onReturnFocus}
			/>,
		);
	});

	return (
		<div className={`ms3-search-result ms3-search-result--${status}`}>
			{status === SEARCH_STATUS_ERROR && (
				<p className="ms3-search-result__error">
					{translate("ui.search.result.error")}
				</p>
			)}

			{status === SEARCH_STATUS_EMPTY && (
				<p className="ms3-search-result__empty-message">
					{translate("ui.search.result.empty")}
				</p>
			)}

			{(status === SEARCH_STATUS_FOUND ||
				status === SEARCH_STATUS_LOADING) &&
				features &&
				Object.keys(groupedEntries).map((group) => (
					<div className="ms3-search-result__group" key={group}>
						{group && group !== defaultGroup ? (
							<h4 className="ms3-search-result__group-head">
								{group}
							</h4>
						) : null}

						<ul className="ms3-search-result__list">
							{groupedEntries[group]}
						</ul>
					</div>
				))}
		</div>
	);
}

export default memo(SearchResult);
