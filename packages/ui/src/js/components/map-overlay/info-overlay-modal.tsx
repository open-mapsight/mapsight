import type {PropsWithChildren} from "react";
import {memo, useCallback, useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import {setOverlayModalVisible} from "../../store/actions";
import {
	isOverlayModalVisibleSelector,
	isViewMobileOrMapOnlySelector,
} from "../../store/selectors";
import Modal from "../modal";

const InfoOverlayModal = memo(InfoOverlayModel_);

function InfoOverlayModel_({children}: PropsWithChildren) {
	const dispatch = useDispatch();

	const isExpanded = useSelector(isOverlayModalVisibleSelector);
	const isMobileOrMapOnly = useSelector(isViewMobileOrMapOnlySelector);

	// close modals on view-switch to something else than mobile
	useEffect(() => {
		if (!isMobileOrMapOnly) {
			dispatch(setOverlayModalVisible(false));
		}
	}, [dispatch, isMobileOrMapOnly]);

	const collapse = useCallback(() => {
		dispatch(setOverlayModalVisible(false));
	}, [dispatch]);

	return (
		<Modal
			isOpen={isExpanded}
			contentLabel={translate("ui.map-overlay.info.modal.label")}
			closeLabel={
				isMobileOrMapOnly
					? translate("ui.map-overlay.info.closeSources")
					: translate("ui.map-overlay.info.closeLegend")
			}
			headline={translate("ui.map-overlay.info.modal.headline")}
			onRequestClose={collapse}
		>
			{children}
		</Modal>
	);
}

export default InfoOverlayModal;
