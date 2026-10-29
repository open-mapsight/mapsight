import type {PropsWithChildren} from "react";
import {memo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import useHydrated from "../../hooks/useHydrated";
import {setOverlayModalVisible} from "../../store/actions";
import {isOverlayModalVisibleSelector} from "../../store/selectors";
import ErrorBoundary from "../error-boundary";
import Modal from "../modal";

const InfoOverlayModal = memo(InfoOverlayModel_);

function InfoOverlayModel_({children}: PropsWithChildren) {
	const dispatch = useDispatch();
	const hydrated = useHydrated();

	const isExpanded = useSelector(isOverlayModalVisibleSelector);

	const collapse = useCallback(() => {
		dispatch(setOverlayModalVisible(false));
	}, [dispatch]);

	if (!hydrated) return null;

	return (
		<Modal
			isOpen={isExpanded}
			contentLabel={translate("ui.map-overlay.info.modal.label")}
			closeLabel={translate("ui.map-overlay.info.closeSources")}
			headline={translate("ui.map-overlay.info.modal.headline")}
			onRequestClose={collapse}
		>
			<ErrorBoundary variant="region">{children}</ErrorBoundary>
		</Modal>
	);
}

export default InfoOverlayModal;
