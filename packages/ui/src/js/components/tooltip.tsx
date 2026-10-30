import type {HTMLAttributes, ReactElement, RefAttributes} from "react";
import {cloneElement, useRef} from "react";
import {mergeProps, mergeRefs, useFocusable} from "react-aria";
import {Tooltip as AriaTooltip, TooltipTrigger} from "react-aria-components";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

/** Single DOM element that can take a ref. Fragments and non-forwarding components will not receive hover/focus. */
export type TooltipTriggerElement = ReactElement<
	HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>
>;

export type TooltipProps = {
	text: string;
	children: TooltipTriggerElement;
	className?: string;
	placement?: TooltipPlacement;
	/** When false, the tooltip stays on `placement` instead of flipping to fit. */
	shouldFlip?: boolean;
};

function TooltipTarget({children}: {children: TooltipTriggerElement}) {
	const ref = useRef<HTMLElement>(null);
	const {focusableProps} = useFocusable({}, ref);
	return cloneElement(children, {
		...mergeProps(focusableProps, children.props),
		// Group containers (e.g. the region list) must not become extra Tab stops.
		// Native controls retain their normal focusability and explicit indices.
		tabIndex: children.props.tabIndex,
		ref: mergeRefs(ref, children.props.ref),
	});
}

/** Visible hover/focus tooltip. Accessible name stays on the control. */
export default function Tooltip({
	text,
	children,
	className = "ms3-control-tooltip",
	placement = "top",
	shouldFlip = true,
}: TooltipProps): ReactElement {
	return (
		<TooltipTrigger delay={350} closeDelay={80}>
			<TooltipTarget>{children}</TooltipTarget>
			<AriaTooltip
				placement={placement}
				offset={7}
				shouldFlip={shouldFlip}
				className={className}
			>
				{text}
			</AriaTooltip>
		</TooltipTrigger>
	);
}
