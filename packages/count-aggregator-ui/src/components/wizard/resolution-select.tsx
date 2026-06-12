import {type ChangeEvent, type ReactElement, useCallback} from "react";

import {DEFAULT_RESOLUTION_LABELS} from "../../types";
import type {DataResolution, Resolution} from "../../types";
import {Section} from "./section.js";

export function ResolutionSelect({
	resolution,
	resolutions,
	resolutionLabels,
	onChange,
}: {
	resolution: DataResolution;
	resolutions: readonly Resolution[];
	resolutionLabels?: Partial<Record<Resolution, string>>;
	onChange: (resolution: DataResolution) => void;
}): ReactElement {
	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			onChange(event.target.value as DataResolution);
		},
		[onChange],
	);

	const labels = {...DEFAULT_RESOLUTION_LABELS, ...resolutionLabels};

	return (
		<Section title="Auflösung">
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
