import {visibleLayersWithMiniLegendsSelector} from "@mapsight/core/lib/map/selectors";

import getPath from "@mapsight/lib-js/object/getPath";
import escapeCssName from "@mapsight/lib-js/string/escapeCssName";
import  {memo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {MAP} from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";
import {setMiniLegendLayer, setOverlayModalVisible} from "../../store/actions.ts";
import {
	isOverlayModalVisibleSelector,
	miniLegendLayerIdSelector,
} from "../../store/selectors.ts";

const layersSelector = (state) =>
	visibleLayersWithMiniLegendsSelector(state[MAP]);

/**
 * this is meant to be used as or included in any project side component in Components
 *
 * @type {React.NamedExoticComponent<object>}
 */
const MiniLegend = memo(function MiniLegend() {
	const dispatch = useDispatch();
	const layersWithMiniLegends = useSelector(layersSelector);
	const currentKey = useSelector(miniLegendLayerIdSelector);
	const isOverlayModalVisible = useSelector(isOverlayModalVisibleSelector);

	const openBigLegend = useCallback(
		() => dispatch(setOverlayModalVisible(true)),
		[dispatch],
	);

	const onSelectChange = useCallback(
		/** @param {React.ChangeEvent<HTMLSelectElement>} e event */
		(e) => {
			console.log("MiniLegend onSelectChange", e);
			dispatch(setMiniLegendLayer(e.target.value));
		},
		[dispatch],
	);

	const keys = layersWithMiniLegends && Object.keys(layersWithMiniLegends);
	if (!keys || !keys.length) {
		return null;
	}

	const currentLayer = layersWithMiniLegends[currentKey];
	const cssName = escapeCssName(
		getPath(currentLayer, ["metaData", "title"]) || currentKey,
	);
	const currentLegend = getPath(currentLayer, ["metaData", "miniLegend"]);

	return (
		<div className={`ms3-mini-legend ms3-mini-legend--${cssName}`}>
			<div className="ms3-mini-legend__select" aria-hidden={true}>
				<select
					value={currentKey}
					onChange={onSelectChange}
					disabled={keys.length === 1}
				>
					{Object.keys(layersWithMiniLegends).map((key) => (
						<option key={key} value={key}>
							{getPath(layersWithMiniLegends[key], [
								"metaData",
								"title",
							]) || key}
						</option>
					))}
				</select>
			</div>

			{typeof currentLegend === "string" ? (
				<div
					aria-hidden={true}
					className="ms3-mini-legend__legend"
					dangerouslySetInnerHTML={{__html: currentLegend}}
				/>
			) : (
				<div aria-hidden={true} className="ms3-mini-legend__legend">
					{getPath(currentLayer, ["metaData", "miniLegend"])}
				</div>
			)}

			<div className="ms3-mini-legend__more">
				<button
					type="button"
					onClick={openBigLegend}
					aria-expanded={isOverlayModalVisible}
				>
					<span className="ms3-visuallyhidden">
						{translate("ui.map-overlay.info.open")}
					</span>
					{/* eslint-disable-next-line no-irregular-whitespace */}
					<span aria-hidden={true}>. . .</span>
				</button>
			</div>
		</div>
	);
});

export default MiniLegend;
