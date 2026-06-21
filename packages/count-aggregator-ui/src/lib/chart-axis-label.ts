import type {CSSProperties} from "react";

export function createYAxisUnitLabel(
	unit: string,
	style: CSSProperties = {},
): {
	value: string;
	angle: number;
	position: "top";
	offset: number;
	style: CSSProperties;
} {
	return {
		value: unit,
		angle: 0,
		position: "top",
		offset: 8,
		style: {
			fontSize: 12,
			textAnchor: "start",
			...style,
		},
	};
}

/** Extra top margin when a unit label sits above the Y-axis. */
export const Y_AXIS_UNIT_LABEL_TOP_MARGIN = 20;
