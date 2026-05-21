import {memo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";

import {setOverlayModalVisible} from "../../store/actions";

import {
	isOverlayModalVisibleSelector,
	isViewMobileOrMapOnlySelector,
} from "../../store/selectors";

import Logo from "./logo";

function InfoOverlayLeft() {
	const dispatch = useDispatch();

	const isMobileOrMapOnly = useSelector(isViewMobileOrMapOnlySelector);
	const isOverlayModalVisible = useSelector(isOverlayModalVisibleSelector);

	const expand = useCallback(() => {
		dispatch(setOverlayModalVisible(true));
	}, [dispatch]);

	return (
		<div className="ms3-info-overlay__area ms3-info-overlay__area--left">
			{/* we are already handling breakpoints in css, but im keeping this condition,
			cause of unknown invariants in regard to *isMobileOrMapOnly* & css */}
			{!isMobileOrMapOnly && (
				<div className="ms3-info-overlay__logo ms3-info-overlay__desktop-content">
					<Logo />
				</div>
			)}

			<div className="ms3-info-overlay__mobile-content">
				<button
					type="button"
					className="ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--info"
					aria-expanded={isOverlayModalVisible}
					onClick={expand}
				>
					<span className="ms3-map-overlay__button__label">
						{translate("ui.map-overlay.info.open")}
					</span>
				</button>
			</div>
		</div>
	);
}

export default memo(InfoOverlayLeft);
