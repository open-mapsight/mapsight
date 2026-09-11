import type {ReactElement} from "react";

import Tooltip, {type TooltipProps} from "../tooltip";

export type PlaceActionTooltipProps = TooltipProps;

/** Place-action hover/focus tooltip. Accessible name stays on the control. */
export default function PlaceActionTooltip({
	className = "ms3-control-tooltip",
	...props
}: TooltipProps): ReactElement {
	return <Tooltip className={className} {...props} />;
}
