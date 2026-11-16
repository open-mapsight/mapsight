import {type ReactElement, memo} from "react";

import {formatStationLabel} from "../../lib/stations.js";
import {cn} from "../../lib/utils.js";
import type {Station} from "../../types";
import {ColorDot} from "./color-dot.js";

export const StationLabel = memo(function StationLabel({
	station,
	label,
	color,
	isEnabled = true,
}: {
	station?: Station;
	label?: string;
	color: string;
	isEnabled?: boolean;
}): ReactElement {
	return (
		<>
			<ColorDot isEnabled={isEnabled} color={color} />
			<span
				className={cn(
					"msca:flex-grow",
					!isEnabled && "msca:text-gray-600 msca:line-through",
				)}
			>
				{station ? (
					<>
						{label ?? formatStationLabel(station)}
						{station.sectionDescription &&
						label !==
							`${formatStationLabel(station)} — ${station.sectionDescription.trim()}` ? (
							<span className="msca:ml-1 msca:text-sm msca:text-gray-600">
								{station.sectionDescription}
							</span>
						) : null}
					</>
				) : (
					"…"
				)}
			</span>
		</>
	);
});
