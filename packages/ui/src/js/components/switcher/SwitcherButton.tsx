import type {AriaRole, MouseEventHandler, ReactNode} from "react";

export type SwitcherButtonProps = {
	baseClass?: string;
	children?: ReactNode;
	toggleActive?: MouseEventHandler<HTMLButtonElement>;
	status?: string;
	active?: boolean;
	disabled?: boolean;
	role?: AriaRole;
	"aria-label"?: string;
};

function SwitcherButton(props: SwitcherButtonProps) {
	const {
		baseClass = "ms3-layer-switcher__button", // TODO: Use generic class name
		children,
		toggleActive,
		status,
		active,
		disabled = false,
		role = "checkbox",
		"aria-label": ariaLabel,
	} = props;

	return (
		<button
			type="button"
			role={role}
			tabIndex={role === "radio" ? (active ? 0 : -1) : undefined}
			aria-checked={active ? "true" : "false"}
			aria-label={ariaLabel}
			aria-disabled={disabled ? "true" : undefined}
			disabled={disabled}
			className={`${baseClass} ${baseClass}--${status}`}
			onClick={disabled ? undefined : toggleActive}
		>
			{children}
		</button>
	);
}

export default SwitcherButton;
