import type React from "react";

import ButtonLabel from "./ButtonLabel.tsx";
import Icon from "./Icon.tsx";
import VisuallyHidden from "./VisuallyHidden.tsx";

export type ButtonProps = Omit<React.HTMLProps<HTMLButtonElement>, "type"> & {
	as?: React.ElementType;
	icon?: string;
	label?: string;
	showLabel?: boolean;
	children?: React.ReactNode;
};

const Button = ({
	icon,
	label,
	showLabel = false,
	children,
	className = "",
	disabled = false,
	...props
}: ButtonProps) => (
	<button
		type="button"
		disabled={disabled}
		className={`ms3-vector-editor-button ms3-vector-editor-button--${
			disabled ? "disabled" : "enabled"
		} ${className}`}
		/* only show tooltip if label is not visible: */
		data-tip={!showLabel ? label : null}
		data-for="ms3-vector-editor-tooltip"
		{...props}
	>
		{icon ? <Icon name={icon} /> : null}
		{showLabel ? (
			<ButtonLabel>{label}</ButtonLabel>
		) : (
			<VisuallyHidden>{label}</VisuallyHidden>
		)}
		{children}
	</button>
);

export default Button;
