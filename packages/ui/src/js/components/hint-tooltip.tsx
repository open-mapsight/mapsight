import {type ReactElement, cloneElement} from "react";

import {useFutureFlag} from "../future/context";
import Tooltip, {
	type TooltipPlacement,
	type TooltipTriggerElement,
} from "./tooltip";

export type HintTooltipProps = {
	text: string;
	children: TooltipTriggerElement;
	placement?: TooltipPlacement;
};

/**
 * Leftover hint.css call sites. Default keeps `ms3-hint--*` classes.
 * `future.v8_ariaControlTooltip` switches to {@link Tooltip}. Removed in v8.
 */
export default function HintTooltip({
	text,
	children,
	placement = "right",
}: HintTooltipProps): ReactElement {
	const useAria = useFutureFlag("v8_ariaControlTooltip");
	const namedChild = cloneElement(children, {
		"aria-label": children.props["aria-label"] ?? text,
	});

	if (useAria) {
		return (
			<Tooltip text={text} placement={placement}>
				{namedChild}
			</Tooltip>
		);
	}

	const hintClass = `ms3-hint--${placement} ms3-hint--rounded`;
	const existing = namedChild.props.className;
	return cloneElement(namedChild, {
		className: existing ? `${existing} ${hintClass}` : hintClass,
	});
}
