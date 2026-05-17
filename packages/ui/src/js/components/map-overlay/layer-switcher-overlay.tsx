import {memo, useCallback, useState} from "react";
import {useSelector} from "react-redux";

import {FocusTrap} from "focus-trap-react";

import {translate} from "../../helpers/i18n";
import {isViewMobileOrMapOnlySelector} from "../../store/selectors";
import LayerSwitcher from "../layer-switcher";
import Modal from "../modal";

const LayerSwitcherContent = memo(function LayerSwitcherContent({
	isExpanded,
	closeSearch,
}: {
	isExpanded: boolean;
	closeSearch: () => void;
}) {
	const isMobileOrMapOnly = useSelector(isViewMobileOrMapOnlySelector);

	if (isMobileOrMapOnly) {
		return (
			<Modal
				isOpen={isExpanded}
				contentLabel={translate(
					"ui.map-overlay.layer-switcher.modal.label",
				)}
				closeLabel={translate(
					"ui.map-overlay.layer-switcher.closeLayers",
				)}
				headline={translate("ui.map-overlay.layer-switcher.layers")}
				onRequestClose={closeSearch}
			>
				<LayerSwitcher onClose={closeSearch} />
			</Modal>
		);
	}

	if (isExpanded) {
		return (
			<FocusTrap
				focusTrapOptions={{
					clickOutsideDeactivates: true,
					onDeactivate: closeSearch,
				}}
			>
				<div>
					<LayerSwitcher onClose={closeSearch} />
				</div>
			</FocusTrap>
		);
	}

	return <div className="ms3-layer-switcher-placeholder" />;
});

function LayerSwitcherOverlay() {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleOpen = useCallback(() => setIsExpanded(true), []);
	const handleClose = useCallback(() => setIsExpanded(false), []);

	return (
		<div
			className={`ms3-layer-switcher-overlay ${
				isExpanded ? "ms3-layer-switcher-overlay--expanded" : ""
			}`}
		>
			<button
				type="button"
				className="ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--layers"
				onClick={handleOpen}
				aria-expanded={isExpanded}
			>
				<span className="ms3-map-overlay__button__label">
					<span aria-hidden="true">
						{translate("ui.map-overlay.layer-switcher.layers")}
					</span>

					<span className="ms3-visuallyhidden">
						{isExpanded &&
							translate(
								"ui.map-overlay.layer-switcher.closeLayers",
							)}
						{!isExpanded &&
							translate(
								"ui.map-overlay.layer-switcher.openLayers",
							)}
					</span>
				</span>
			</button>

			<LayerSwitcherContent
				isExpanded={isExpanded}
				closeSearch={handleClose}
			/>
		</div>
	);
}

export default memo(LayerSwitcherOverlay);
