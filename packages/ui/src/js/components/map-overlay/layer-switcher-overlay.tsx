import {type RefObject, memo, useCallback, useRef, useState} from "react";
import {mergeProps, usePress} from "react-aria";
import {useSelector} from "react-redux";

import {FocusTrap} from "focus-trap-react";

import {translate} from "../../helpers/i18n";
import useOverlayDismiss from "../../hooks/useOverlayDismiss";
import {isViewMobileOrMapOnlySelector} from "../../store/selectors";
import LayerSwitcher from "../layer-switcher";
import Modal from "../modal";

const focusTrapOptions = {
	clickOutsideDeactivates: false,
	escapeDeactivates: false,
} as const;

const LayerSwitcherContent = memo(function LayerSwitcherContent({
	isExpanded,
	closeSearch,
	panelRef,
}: {
	isExpanded: boolean;
	closeSearch: () => void;
	panelRef: RefObject<HTMLDivElement | null>;
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
			<FocusTrap focusTrapOptions={focusTrapOptions}>
				<div ref={panelRef}>
					<LayerSwitcher onClose={closeSearch} />
				</div>
			</FocusTrap>
		);
	}

	return <div className="ms3-layer-switcher-placeholder" />;
});

function LayerSwitcherOverlay() {
	const [isExpanded, setIsExpanded] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const isMobileOrMapOnly = useSelector(isViewMobileOrMapOnlySelector);

	const handleOpen = useCallback(() => setIsExpanded(true), []);
	const handleClose = useCallback(() => setIsExpanded(false), []);

	const {pressProps} = usePress({
		onPress: handleOpen,
	});

	// Mobile uses a portaled Modal (backdrop / close / Esc); panelRef is desktop-only.
	useOverlayDismiss({
		isActive: isExpanded && !isMobileOrMapOnly,
		onDismiss: handleClose,
		excludeRefs: [triggerRef, panelRef],
	});

	return (
		<div
			className={`ms3-layer-switcher-overlay ${
				isExpanded ? "ms3-layer-switcher-overlay--expanded" : ""
			}`}
		>
			<button
				{...mergeProps(pressProps, {
					type: "button" as const,
					className:
						"ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--layers",
					"aria-expanded": isExpanded,
				})}
				ref={triggerRef}
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
				closeSearch={handleClose}
				isExpanded={isExpanded}
				panelRef={panelRef}
			/>
		</div>
	);
}

export default memo(LayerSwitcherOverlay);
