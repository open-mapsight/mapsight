import {type ChangeEvent, type ReactElement, useCallback} from "react";

import type {ChartType} from "../../types";

export function ChartTypeSelect({
	chartType,
	onChange,
}: {
	chartType: ChartType;
	onChange: (chartType: ChartType) => void;
}): ReactElement {
	const handleChange = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) => {
			onChange(event.target.value as ChartType);
		},
		[onChange],
	);

	return (
		<div className="msca:mt-4 msca:border-t msca:border-[var(--msca-color-border)] msca:pt-3 msca:text-right msca:text-sm">
			<label htmlFor="count-aggregator-chart-type">
				Diagrammtyp:{" "}
				<select
					className="msca:rounded msca:border msca:border-[var(--msca-color-border)] msca:bg-[var(--msca-color-surface)] msca:px-2 msca:py-1"
					id="count-aggregator-chart-type"
					value={chartType}
					onChange={handleChange}
				>
					<option value="area">Flächendiagramm</option>
					<option value="column">Balkendiagramm</option>
				</select>
			</label>
			<p className="msca:mt-1 msca:text-gray-600">
				*) Bei vielen Datenpunkten ist die Darstellung als
				Balkendiagramm nicht sinnvoll.
			</p>
		</div>
	);
}
