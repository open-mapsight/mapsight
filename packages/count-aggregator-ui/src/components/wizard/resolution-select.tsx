import {type ChangeEvent, type ReactElement, useCallback} from "react";

import {useCountAggregatorI18n} from "../../context/count-aggregator-provider.js";
import {getValuesModeLabels} from "../../lib/i18n.js";
import type {ValuesMode} from "../../types";
import {Section} from "./section.js";

export function ResolutionSelect({
	resolution,
	resolutions,
	resolutionLabels,
	onChange,
}: {
	resolution: ValuesMode;
	resolutions: readonly ValuesMode[];
	resolutionLabels?: Partial<Record<ValuesMode, string>>;
	onChange: (resolution: ValuesMode) => void;
}): ReactElement {
	const {t} = useCountAggregatorI18n();
	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			onChange(event.target.value as ValuesMode);
		},
		[onChange],
	);

	const labels = {...getValuesModeLabels(t), ...resolutionLabels};

	return (
		<Section title={t("resolution.section")}>
			<span className="msca:flex msca:flex-wrap msca:gap-4">
				{resolutions.map((value) => (
					<label
						key={value}
						className="msca:flex msca:cursor-pointer msca:items-center msca:gap-2"
						htmlFor={`count-aggregator-resolution-${value}`}
					>
						<input
							className="msca:size-4"
							type="radio"
							name="resolution"
							value={value}
							checked={resolution === value}
							onChange={handleChange}
							id={`count-aggregator-resolution-${value}`}
						/>
						<span>{labels[value]}</span>
					</label>
				))}
			</span>
		</Section>
	);
}
