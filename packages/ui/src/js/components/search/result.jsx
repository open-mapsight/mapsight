import {memo, useMemo} from "react";
import {useSelector} from "react-redux";

import AsyncStatusRegion from "../async-status/AsyncStatusRegion";
import getFeatureProperty from "../../helpers/get-feature-property";
import {translate} from "../../helpers/i18n";
import {
	SEARCH_STATUS_INACTIVE,
	searchStatusToView,
} from "../../lib/async-status/adapters/search-status-to-view";
import {
	searchResultFeaturesSelector,
	searchStatusSelector,
} from "../../store/selectors";

import SearchResultEntry from "./result-entry";

const defaultGroup = "__default__";

function SearchResult({closeSearch, onReturnFocus}) {
	const status = useSelector(searchStatusSelector);
	const features = useSelector(searchResultFeaturesSelector);

	const view = useMemo(
		() => searchStatusToView(status, features),
		[status, features],
	);

	const groupedEntries = useMemo(() => {
		const entries = {};
		features.forEach((feature, i) => {
			const group = getFeatureProperty(feature, "group") || defaultGroup;
			entries[group] = entries[group] || [];
			entries[group].push(
				<SearchResultEntry
					key={feature.id || i}
					feature={feature}
					closeSearch={closeSearch}
					onReturnFocus={onReturnFocus}
				/>,
			);
		});
		return entries;
	}, [closeSearch, features, onReturnFocus]);

	const listContent = useMemo(() => {
		if (!features?.length) {
			return null;
		}

		return Object.keys(groupedEntries).map((group) => (
			<div className="ms3-search-result__group" key={group}>
				{group && group !== defaultGroup ? (
					<h4 className="ms3-search-result__group-head">{group}</h4>
				) : null}

				<ul className="ms3-search-result__list">
					{groupedEntries[group]}
				</ul>
			</div>
		));
	}, [features, groupedEntries]);

	if (status === SEARCH_STATUS_INACTIVE) {
		return (
			<div
				className={`ms3-search-result ms3-search-result--${status}`}
			/>
		);
	}

	return (
		<div className={`ms3-search-result ms3-search-result--${status}`}>
			<AsyncStatusRegion
				className="ms3-search-result__status-region"
				contentClassName="ms3-search-result__content"
				emptyMessage={
					<p className="ms3-search-result__empty-message">
						{translate("ui.search.result.empty")}
					</p>
				}
				errorMessage={
					<p className="ms3-search-result__error">
						{translate("ui.search.result.error")}
					</p>
				}
				isEmpty={() => !features?.length}
				loadingMessage={null}
				variant="placeholder"
				view={view}
			>
				{listContent}
			</AsyncStatusRegion>
		</div>
	);
}

export default memo(SearchResult);
