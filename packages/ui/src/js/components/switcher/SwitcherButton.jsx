function SwitcherButton(props) {
	const {
		baseClass = "ms3-layer-switcher__button", // TODO: Use generic class name
		children,
		toggleActive,
		status,
		active,
	} = props;

	return (
		<button
			type="button"
			role="checkbox"
			aria-checked={active ? "true" : "false"}
			className={`${baseClass} ${baseClass}--${status}`}
			onClick={toggleActive}
		>
			{children}
		</button>
	);
}

export default SwitcherButton;
