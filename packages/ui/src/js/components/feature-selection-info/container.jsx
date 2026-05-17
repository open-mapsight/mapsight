function Container({children, className = "", ...attrs}) {
	return (
		<div className={`ms3-feature-selection-info ${className}`} {...attrs}>
			{children}
		</div>
	);
}

export default Container;
