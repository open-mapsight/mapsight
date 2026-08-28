function SwitcherButton(props) {
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
