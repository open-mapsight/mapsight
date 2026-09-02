import {type ReactElement, cloneElement} from "react";

import {useFutureFlag} from "../future/context";
import Tooltip, {type TooltipPlacement} from "./tooltip";

export type HintTooltipProps = {
	text: string;
	children: ReactElement<{className?: string; "aria-label"?: string}>;
	placement?: TooltipPlacement;
	className?: string;
};

/**
 * Leftover hint.css call sites. Default keeps `ms3-hint--*` classes.
 * `future.v8_ariaControlTooltip` switches to {@link Tooltip}. Removed in v8.
 */
export default function HintTooltip({
	text,
	children,
	placement = "right",
	className,
}: HintTooltipProps): ReactElement {
	const useAria = useFutureFlag("v8_ariaControlTooltip");
	if (useAria) {
		return (
			<Tooltip text={text} placement={placement} className={className}>
				{children}
			</Tooltip>
		);
	}

	const hintClass = `ms3-hint--${placement} ms3-hint--rounded`;
	const existing = children.props.className;
	return cloneElement(children, {
		className: existing ? `${existing} ${hintClass}` : hintClass,
		"aria-label": children.props["aria-label"] ?? text,
	});
}
