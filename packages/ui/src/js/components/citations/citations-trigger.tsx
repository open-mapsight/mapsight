import {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import {setOverlayModalVisible} from "../../store/actions";
import {isOverlayModalVisibleSelector} from "../../store/selectors";

export default function CitationsTrigger({
	className = "ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--info",
}: {
	className?: string;
}) {
	const dispatch = useDispatch();
	const isOverlayModalVisible = useSelector(isOverlayModalVisibleSelector);
	const expand = useCallback(() => {
		dispatch(setOverlayModalVisible(true));
	}, [dispatch]);

	return (
		<button
			type="button"
			className={className}
			aria-expanded={isOverlayModalVisible}
			onClick={expand}
		>
			<span className="ms3-map-overlay__button__label">
				{translate("ui.map-overlay.info.open")}
			</span>
		</button>
	);
}
