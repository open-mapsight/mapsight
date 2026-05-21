import {
	reduceLayersToLegends,
	visibleLayersWithLegendsSelector,
} from "@mapsight/core/lib/map/selectors";
import {memo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";
import {createSelector} from "@reduxjs/toolkit";

import {MAP} from "../../config/constants/controllers";

import {translate} from "../../helpers/i18n";
import {setOverlayModalVisible} from "../../store/actions";

import Attribution from "./attribution";

const legendsSelector = createSelector(
	(state) => visibleLayersWithLegendsSelector(state[MAP]),
	// we need to run this as well, cause it's filtering stuff
	reduceLayersToLegends,
);

function InfoOverlayRight() {
	const dispatch = useDispatch();

	const legends = useSelector(legendsSelector);

	const expand = useCallback(() => {
		dispatch(setOverlayModalVisible(true));
	}, [dispatch]);

	const hasLegend = Object.keys(legends).length > 0;

	return (
		<div className="ms3-info-overlay__desktop-content ms3-info-overlay__area ms3-info-overlay__area--right">
			<Attribution>
				{hasLegend && (
					<button type="button" onClick={expand}>
						{translate("ui.map-overlay.info.legend")}
					</button>
				)}
			</Attribution>
		</div>
	);
}

export default memo(InfoOverlayRight);
