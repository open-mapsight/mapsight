function AdditionalContent({as: T = "div", className = "", ...attrs}) {
	return (
		<T
			className={`ms3-additional-container__content ${className}`}
			{...attrs}
		/>
	);
}

export default AdditionalContent;
