import {memo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import {setSelectedRegionIdAndAnimateMap} from "../../store/actions";
import {regionsSelector, selectedRegionIdSelector} from "../../store/selectors";
import HintTooltip from "../hint-tooltip";

const RegionSelectorEntry = memo(
	/**
	 * @param {{
	 *   regionId: string,
	 *   region: {label: string}
	 * }} props props
	 * @returns {import('react').ReactElement} element
	 */
	function RegionSelectorEntry({regionId, region}) {
		const dispatch = useDispatch();

		const onClick = useCallback(() => {
			dispatch(setSelectedRegionIdAndAnimateMap(regionId));
		}, [dispatch, regionId]);

		const selectedRegionId = useSelector(selectedRegionIdSelector);

		return (
			<li
				className={`ms3-region-selector-entry${
					regionId === selectedRegionId
						? " ms3-region-selector-entry--selected"
						: ""
				}`}
			>
				<button type="button" onClick={onClick}>
					{region.label}
				</button>
			</li>
		);
	},
);

const RegionSelector = memo(function RegionSelector({
	as: T = "ul",
	style = {},
}) {
	const regions = useSelector(regionsSelector);

	if (!regions) {
		return null;
	}

	const label = translate("ui.region-selector.label");

	return (
		<HintTooltip text={label} placement="right">
			<T className="ms3-region-selector" style={style} aria-label={label}>
				{Object.entries(regions).map(([id, region]) => (
					<RegionSelectorEntry
						key={id}
						regionId={id}
						region={region}
					/>
				))}
			</T>
		</HintTooltip>
	);
});

export default RegionSelector;
