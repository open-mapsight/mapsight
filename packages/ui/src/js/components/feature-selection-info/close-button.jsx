import {removeFrom} from "@mapsight/core/lib/base/actions";
import {useCallback} from "react";
import {useDispatch} from "react-redux";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";

import {translate} from "../../helpers/i18n";
import {
	APP_EVENT_FOCUS_FEATURE_LIST,
	useAppChannelDispatchEvent,
} from "../helping/app-channel";

function CloseButton({
	feature,
	enableKeyboardControl,
	className = "",
	...attrs
}) {
	const dispatch = useDispatch();
	const removeSelection = useCallback(() => {
		console.log("click close fSI");
		dispatch(
			removeFrom(
				[FEATURE_SELECTIONS, FEATURE_SELECTION_SELECT, "features"],
				feature?.id,
			),
		);
	}, [dispatch, feature?.id]);

	const appChannelDispatch = useAppChannelDispatchEvent();
	const handleCloseByKeyboard = useCallback(
		/** @param {KeyboardEvent} ev ev */ (ev) => {
			if (enableKeyboardControl) {
				console.log("keyboard close fSI");
				if (
					ev.key === "Enter" ||
					ev.key === "Spacebar" ||
					ev.key === " "
				) {
					appChannelDispatch(new Event(APP_EVENT_FOCUS_FEATURE_LIST));
				}
			}
		},
		[enableKeyboardControl, appChannelDispatch],
	);

	return (
		<button
			type="button"
			className={`ms3-button ms3-feature-selection-info__close-button ${className}`}
			onClick={removeSelection}
			onKeyDown={handleCloseByKeyboard}
			// TODO: ARIA
			//aria-controls={}
			{...attrs}
		>
			<span className="ms3-visuallyhidden">
				{translate("ui.feature-selection-info.close")}
			</span>
		</button>
	);
}

export default CloseButton;
