export type SwitcherStatusIconProps = {
	baseClassName?: string;
	status: string;
	label: string;
	onClick?: () => void;
	active?: boolean;
};

function SwitcherStatusIcon({
	baseClassName = "ms3-layer-switcher__status", // TODO: Use generic class name
	status,
	label,
	onClick,
	active,
}: SwitcherStatusIconProps) {
	if (onClick) {
		return (
			<button
				type="button"
				role="checkbox"
				className={`${baseClassName} ${baseClassName}--${status}`}
				aria-label={label}
				aria-checked={active ? "true" : "false"}
				onClick={onClick}
			/>
		);
	} else {
		return (
			<span
				role="img"
				className={`${baseClassName} ${baseClassName}--${status}`}
				aria-label={label}
			/>
		);
	}
}

export default SwitcherStatusIcon;
