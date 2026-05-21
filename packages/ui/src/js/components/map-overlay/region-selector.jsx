import  {memo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";
import {setSelectedRegionIdAndAnimateMap} from "../../store/actions";

import {regionsSelector, selectedRegionIdSelector} from "../../store/selectors";

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

	return (
		<T
			className="ms3-region-selector [ ms3-hint--right ms3-hint--rounded ]"
			style={style}
			aria-label="Gebiet auf Karte zentrieren …"
		>
			{Object.entries(regions).map(([id, region]) => (
				<RegionSelectorEntry key={id} regionId={id} region={region} />
			))}
		</T>
	);
});

export default RegionSelector;
