import {memo, useCallback, useState} from "react";
import {useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import {
	haveSearchInMapSelector,
	isViewMobileOrMapOnlySelector,
	searchRenderFormSelector,
} from "../../store/selectors";
import Modal from "../modal";
import Search from "../search";

export type SearchOverlayProps = {renderForm?: boolean};

function SearchOverlay({renderForm}: SearchOverlayProps) {
	const configuredRenderForm = useSelector(searchRenderFormSelector);
	const searchProps = {renderForm: renderForm ?? configuredRenderForm};
	const [isExpanded, setIsExpanded] = useState(false);

	const searchInMap = useSelector(haveSearchInMapSelector);
	const isMobileOrMapOnly = useSelector(isViewMobileOrMapOnlySelector);

	const toggleIsExpanded = useCallback(() => {
		setIsExpanded((prevVal) => !prevVal);
	}, [setIsExpanded]);

	const closeSearch = useCallback(() => {
		setIsExpanded(false);
	}, [setIsExpanded]);

	if (searchInMap === false) {
		return null;
	}

	let children;
	if (isMobileOrMapOnly) {
		children = (
			<div>
				<button
					type="button"
					className="ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--search"
					onClick={toggleIsExpanded}
				>
					<span className="ms3-map-overlay__button__label">
						<span className="ms3-visuallyhidden">
							{translate(
								isExpanded
									? "ui.map-overlay.search.close"
									: "ui.map-overlay.search.open",
							)}
						</span>
					</span>
				</button>

				<Modal
					isOpen={isExpanded}
					contentLabel={translate(
						"ui.map-overlay.search.modal.label",
					)}
					closeLabel={translate("ui.map-overlay.search.close")}
					headline={translate("ui.map-overlay.search.modal.headline")}
					onRequestClose={closeSearch}
				>
					<Search {...searchProps} closeSearch={closeSearch} />
				</Modal>
			</div>
		);
	} else {
		children = <Search {...searchProps} />;
	}

	return (
		<div
			className={`ms3-search-overlay ${
				isExpanded ? "ms3-search-overlay--expanded" : ""
			}`}
		>
			{children}
		</div>
	);
}

export default memo(SearchOverlay);
