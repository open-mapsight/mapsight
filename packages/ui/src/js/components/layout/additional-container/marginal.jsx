function Marginal({as: T = "div", position, className = "", ...attrs}) {
	return (
		<T
			className={`ms3-marginal ms3-marginal--${position} ${className}`}
			{...attrs}
		/>
	);
}

export default Marginal;
