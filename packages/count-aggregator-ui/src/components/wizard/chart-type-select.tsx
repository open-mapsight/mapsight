import {type ChangeEvent, type ReactElement, useCallback} from "react";

import {useCountAggregatorI18n} from "../../context/count-aggregator-provider.js";
import type {ChartType} from "../../types";

export function ChartTypeSelect({
	chartType,
	onChange,
}: {
	chartType: ChartType;
	onChange: (chartType: ChartType) => void;
}): ReactElement {
	const {t} = useCountAggregatorI18n();
	const handleChange = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) => {
			onChange(event.target.value as ChartType);
		},
		[onChange],
	);

	return (
		<div className="msca:mt-4 msca:border-t msca:border-[var(--msca-color-border)] msca:pt-3 msca:text-right msca:text-sm">
			<label htmlFor="count-aggregator-chart-type">
				{t("chartType.select")}{" "}
				<select
					className="msca:rounded msca:border msca:border-[var(--msca-color-border)] msca:bg-[var(--msca-color-surface)] msca:px-2 msca:py-1"
					id="count-aggregator-chart-type"
					value={chartType}
					onChange={handleChange}
				>
					<option value="area">{t("chartType.area")}</option>
					<option value="column">{t("chartType.column")}</option>
				</select>
			</label>
			<p className="msca:mt-1 msca:text-gray-600">
				{t("chartType.note")}
			</p>
		</div>
	);
}
