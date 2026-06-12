import {Fragment, type ReactElement, memo, useCallback, useMemo} from "react";
import Select, {
	type CSSObjectWithLabel,
	type GroupBase,
	type MultiValue,
	type SingleValue,
	type StylesConfig,
} from "react-select";

import {useCountAggregatorPortal} from "../../context/count-aggregator-root.js";
import {isDefined} from "../../lib/utils.js";
import type {Station} from "../../types";

export interface SelectStyleOverrides {
	control?: CSSObjectWithLabel;
	container?: CSSObjectWithLabel;
}

export function getSelectStyles(
	overrides: SelectStyleOverrides = {},
): StylesConfig<Station, boolean, GroupBase<Station>> {
	return {
		container(provided) {
			return {...provided, ...overrides.container};
		},
		control: (provided) => ({
			...provided,
			minHeight: 34,
			minWidth: 300,
			maxWidth: 400,
			fontSize: "14px",
			lineHeight: "auto",
			borderColor: "var(--msca-color-border, #e5e7eb)",
			borderRadius: "var(--msca-radius, 4px)",
			...overrides.control,
		}),
		dropdownIndicator: (provided) => ({
			...provided,
			padding: 6,
		}),
	};
}

function createFormatOptionLabel(showDescriptionInSelection: boolean) {
	return function formatOptionLabel(
		station: Station,
		{context}: {context: "menu" | "value"},
	): ReactElement {
		const showDesc = showDescriptionInSelection || context === "menu";

		return (
			<Fragment>
				<strong
					className="msca:font-bold"
					title={`${station.label ?? ""} ${station.sectionDescription ?? ""} (${station.originId})`}
				>
					{station.label || station.originId}
				</strong>
				{showDesc && station.sectionDescription ? (
					<>
						{" "}
						<span className="msca:text-xs">
							{station.sectionDescription}
						</span>
					</>
				) : null}
			</Fragment>
		);
	};
}

function getOptionLabel(station: Station): string {
	return `${station.label ?? ""} ${station.typeName} ${station.sectionDescription ?? ""}`;
}

export const StationSelect = memo(function StationSelect({
	stationsById,
	stationIds,
	onChange,
	isMulti = false,
	className,
	styleOverrides = {},
	showDescriptionInSelection = true,
	closeMenuOnSelect,
	placeholder = "Messstelle wählen…",
}: {
	stationsById: Map<number, Station> | undefined;
	stationIds: readonly number[];
	onChange: (stationIds: readonly number[]) => void;
	isMulti?: boolean;
	className?: string;
	styleOverrides?: SelectStyleOverrides;
	showDescriptionInSelection?: boolean;
	closeMenuOnSelect?: boolean;
	placeholder?: string;
}): ReactElement {
	const portalTarget = useCountAggregatorPortal();

	const options = useMemo(
		() =>
			stationsById === undefined
				? []
				: Array.from(stationsById.values()).sort((a, b) =>
						getOptionLabel(a).localeCompare(getOptionLabel(b)),
					),
		[stationsById],
	);

	const value = useMemo(() => {
		if (stationsById === undefined) {
			return isMulti ? [] : null;
		}

		const selected = stationIds
			.map((id) => stationsById.get(id))
			.filter(isDefined);

		return isMulti ? selected : (selected[0] ?? null);
	}, [isMulti, stationIds, stationsById]);

	const handleChange = useCallback(
		(selected: MultiValue<Station> | SingleValue<Station>) => {
			if (isMulti) {
				onChange(
					(selected as MultiValue<Station>).map(
						(station) => station.id,
					),
				);
				return;
			}

			const single = selected as SingleValue<Station>;
			onChange(single ? [single.id] : []);
		},
		[isMulti, onChange],
	);

	return (
		<Select
			className={className}
			isMulti={isMulti}
			options={options}
			value={value}
			onChange={handleChange}
			getOptionLabel={getOptionLabel}
			getOptionValue={(station) => station.id.toString(10)}
			formatOptionLabel={createFormatOptionLabel(
				showDescriptionInSelection,
			)}
			styles={getSelectStyles(styleOverrides)}
			menuPortalTarget={portalTarget}
			menuPosition="fixed"
			closeMenuOnSelect={closeMenuOnSelect}
			isClearable={!isMulti}
			placeholder={placeholder}
			noOptionsMessage={() => "Keine Messstellen gefunden"}
		/>
	);
});
