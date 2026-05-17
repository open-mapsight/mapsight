function SwitcherStatusIcon(props) {
	const {
		baseClassName = "ms3-layer-switcher__status", // TODO: Use generic class name
		status,
		children,
		onClick,
		active,
		...rest
	} = props;

	if (onClick) {
		return (
			<button
				type="button"
				role="checkbox"
				className={`${baseClassName} ${baseClassName}--${status}`}
				// FIXME: are we putting a ReactNode in a aria-label (which takes strings) O.0
				aria-label={children}
				aria-checked={active ? "true" : "false"}
				onClick={onClick}
				{...rest}
			/>
		);
	} else {
		return (
			<span
				className={`${baseClassName} ${baseClassName}--${status}`}
				// FIXME: are we putting a ReactNode in a aria-label (which takes strings) O.0
				aria-label={children}
				{...rest}
			/>
		);
	}
}

export default SwitcherStatusIcon;
