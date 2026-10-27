import {type ReactElement, cloneElement, useContext} from "react";

import {FutureFlagsContext} from "../future/context";
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
 * Control tooltip with Escape dismissal and hoverable content.
 * Set `future.v8_ariaControlTooltip: false` to opt out and retain hint.css.
 */
export default function HintTooltip({
	text,
	children,
	placement = "right",
}: HintTooltipProps): ReactElement {
	const useAria =
		useContext(FutureFlagsContext).v8_ariaControlTooltip !== false;
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
