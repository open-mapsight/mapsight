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
 * Nested `<option>` / `<optgroup>` tree for place-based list sorting.
 */
export function renderPlaceOptions(
	places: MapsightUiPlacesData,
	keyPath: Array<string> = [],
): Array<ReactElement> {
	return Object.entries(places).map(([key, place]) => {
		const nextKeyPath = [...keyPath, key];
		const value = nextKeyPath.join(",");

		if ("type" in place && place.type === "group") {
			return (
				<optgroup label={place.title} key={value}>
					{renderPlaceOptions(place.entries, nextKeyPath)}
				</optgroup>
			);
		}

		return (
			<option value={value} key={value}>
				{place.title}
			</option>
		);
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
	sorting: string | undefined;
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

				{renderPlaceOptions(places)}
			</select>

			<StatusIndicator status={geolocationStatus} />
		</FilterToggleControl>
	);
}

export default memo(FeatureSorter);
