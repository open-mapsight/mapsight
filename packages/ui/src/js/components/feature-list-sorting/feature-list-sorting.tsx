import type {ChangeEvent, ReactElement} from "react";
import {memo, useCallback} from "react";

import {hasGeolocationSupport} from "@mapsight/core/lib/helpers";

import {translate} from "../../helpers/i18n";
import FilterToggleControl from "../filter-toggle-control/FilterToggleControl";
import StatusIndicator from "./status-indicator";

export type MapsightUiPlace = {title: string; x: number; y: number; z?: number};
export type MapsightUiPlaceGroup = {
	type: "group";
	title: string;
	entries: MapsightUiPlacesData;
};
export type MapsightUiPlacesData = Record<
	string,
	MapsightUiPlace | MapsightUiPlaceGroup
>;

/**
 * @param places places
 * @param keyPath key path
 * @returns option elements
 */
function renderOptions(
	places: MapsightUiPlacesData,
	keyPath: Array<string> = [],
): Array<ReactElement> {
	return Object.entries(places).map(([key, place]) => {
		const keyArr = [...keyPath, key];
		const keyStr = keyArr.join(",");

		if ("type" in place && place.type === "group") {
			return (
				<optgroup label={place.title} key={keyStr}>
					{renderOptions(place.entries, keyArr)}
				</optgroup>
			);
		} else {
			return (
				<option value={keyStr} key={keyStr}>
					{place.title}
				</option>
			);
		}
	});
}

/* NOTICE: using onChange instead of onBlur as the change occurs just below this input and should be clear */
function FeatureSorter({
	places,
	sorting,
	geolocationStatus,
	onChange,
	requestGeolocation,
}: {
	places: MapsightUiPlacesData;
	sorting: string;
	geolocationStatus: string;
	onChange: (value: string) => void;
	requestGeolocation: () => void;
}) {
	const onSelectChange = useCallback(
		(e: ChangeEvent<HTMLSelectElement>) => {
			const newValue = e.target.value;

			if (newValue === "geolocation") {
				requestGeolocation();
			}

			onChange(newValue);
		},
		[onChange, requestGeolocation],
	);

	return (
		<FilterToggleControl
			className="ms3-features-sorting"
			buttonClassName="ms3-filter-button--icon-sort"
			buttonActiveClassName="ms3-filter-button--icon-sort-active"
			title={translate("ui.feature-list.sorting.announcements")}
		>
			{translate("ui.feature-list.sorting.byDistance")}

			<select value={sorting || ""} onChange={onSelectChange}>
				<option value="">
					{translate("ui.feature-list.sorting.choose")}
				</option>

				{hasGeolocationSupport && (
					<option value="geolocation">
						{translate("ui.feature-list.sorting.own")}
					</option>
				)}

				{renderOptions(places)}
			</select>

			<StatusIndicator status={geolocationStatus} />
		</FilterToggleControl>
	);
}

export default memo(FeatureSorter);
