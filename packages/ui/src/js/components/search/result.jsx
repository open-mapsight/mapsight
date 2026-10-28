import {memo, useMemo} from "react";
import {useSelector} from "react-redux";

import {Heading, HeadingContent, useHeadingElement} from "../../headings";
import getFeatureProperty from "../../helpers/get-feature-property";
import {translate} from "../../helpers/i18n";
import {useAsyncStatusDisplay} from "../../lib/async-status";
import {
	SEARCH_STATUS_INACTIVE,
	searchStatusToView,
} from "../../lib/async-status/adapters/search-status-to-view";
import {
	searchResultFeaturesSelector,
	searchStatusSelector,
} from "../../store/selectors";
import AsyncStatusIndicator from "../async-status/AsyncStatusIndicator";
import SearchResultEntry from "./result-entry";

const defaultGroup = "__default__";

/**
 * @param {{
 *   closeSearch?: () => void,
 *   onReturnFocus?: () => void,
 *   onResultSelected?: (feature: import("../../types").MapsightUiFeature) => void,
 *   groupHeadlineAs?: import("react").ElementType,
 * }} props props
 */
function SearchResult({
	closeSearch,
	onReturnFocus,
	onResultSelected,
	groupHeadlineAs,
}) {
	const GroupHeadline = useHeadingElement(
		"searchGroup",
		"h4",
		groupHeadlineAs,
	);
	const status = useSelector(searchStatusSelector);
	const features = useSelector(searchResultFeaturesSelector);

	const view = useMemo(
		() => searchStatusToView(status, features),
		[status, features],
	);

	const display = useAsyncStatusDisplay(view, {
		isEmpty: () => !features?.length,
	});
	const hasContent =
		display.phase === "content" || display.phase === "refreshing";

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
					onResultSelected={onResultSelected}
				/>,
			);
		});
		return entries;
	}, [closeSearch, features, onReturnFocus, onResultSelected]);

	const listContent = useMemo(() => {
		if (!features?.length) {
			return null;
		}

		return Object.keys(groupedEntries).map((group) => (
			<div className="ms3-search-result__group" key={group}>
				{group && group !== defaultGroup ? (
					<Heading
						as={GroupHeadline}
						className="ms3-search-result__group-head"
					>
						{group}
					</Heading>
				) : null}

				<HeadingContent
					headingAs={
						group && group !== defaultGroup
							? GroupHeadline
							: undefined
					}
				>
					<ul className="ms3-search-result__list">
						{groupedEntries[group]}
					</ul>
				</HeadingContent>
			</div>
		));
	}, [features, groupedEntries, GroupHeadline]);

	if (status === SEARCH_STATUS_INACTIVE) {
		return (
			<div className={`ms3-search-result ms3-search-result--${status}`} />
		);
	}

	return (
		<div className={`ms3-search-result ms3-search-result--${status}`}>
			<div
				className={`ms3-async-status-region ms3-search-result__status-region${display.phase === "refreshing" ? " ms3-async-status-region--refreshing" : ""}`}
			>
				{/* Search owns the single live region, including when hosts opt out. */}
				<div className="ms3-async-status-region__status">
					{display.phase === "loading" && (
						<AsyncStatusIndicator
							aria-live="off"
							phase="loading"
							message={null}
						/>
					)}
					{display.phase === "empty" && (
						<p className="ms3-search-result__empty-message">
							{translate("ui.search.result.empty")}
						</p>
					)}
					{hasContent && display.showRefreshing && (
						<AsyncStatusIndicator
							aria-live="off"
							phase="refreshing"
							variant="inline"
							className="ms3-async-status-region__refresh-indicator"
						/>
					)}
				</div>
				{display.phase === "error" && (
					<AsyncStatusIndicator
						aria-live="off"
						phase="error"
						error={
							<p className="ms3-search-result__error">
								{translate("ui.search.result.error")}
							</p>
						}
					/>
				)}
				{display.phase === "refreshing" && display.showError && (
					<div className="ms3-async-status-region__error-banner">
						{translate("ui.search.result.error")}
					</div>
				)}
				{hasContent && (
					<div
						className="ms3-search-result__content"
						aria-busy={
							display.phase === "refreshing" &&
							display.showRefreshing
						}
					>
						{listContent}
					</div>
				)}
			</div>
		</div>
	);
}

export default memo(SearchResult);
