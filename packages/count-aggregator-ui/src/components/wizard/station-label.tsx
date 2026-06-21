import {type ReactElement, memo} from "react";

import {formatStationLabel} from "../../lib/stations.js";
import {cn} from "../../lib/utils.js";
import type {Station} from "../../types";
import {ColorDot} from "./color-dot.js";

export const StationLabel = memo(function StationLabel({
	station,
	color,
	isEnabled = true,
}: {
	station?: Station;
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
						{formatStationLabel(station)}
						{station.sectionDescription ? (
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
