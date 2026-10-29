import {memo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import {setSelectedRegionIdAndAnimateMap} from "../../store/actions";
import {regionsSelector, selectedRegionIdSelector} from "../../store/selectors";
import type {MapsightUiStore} from "../../types";
import type {PolymorphicProps} from "../polymorphic-props";
import Tooltip from "../tooltip";

const RegionSelectorEntry = memo(function RegionSelectorEntry({
	regionId,
	region,
}: {
	regionId: string;
	region: {label?: string};
}) {
	const dispatch = useDispatch<MapsightUiStore["dispatch"]>();

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
			<button
				type="button"
				onClick={onClick}
				aria-pressed={regionId === selectedRegionId}
			>
				{region.label}
			</button>
		</li>
	);
});

const RegionSelector = memo(function RegionSelector({
	as: T = "ul",
	style = {},
}: Pick<PolymorphicProps, "as" | "style">) {
	const regions = useSelector(regionsSelector);

	if (!regions) {
		return null;
	}

	const label = translate("ui.region-selector.label");

	return (
		<Tooltip text={label} placement="right">
			<T className="ms3-region-selector" style={style} aria-label={label}>
				{Object.entries(regions).map(([id, region]) => (
					<RegionSelectorEntry
						key={id}
						regionId={id}
						region={region!}
					/>
				))}
			</T>
		</Tooltip>
	);
});

export default RegionSelector;
