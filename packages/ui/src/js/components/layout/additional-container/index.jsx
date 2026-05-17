function AdditionalContainer({as: T = "div", className = "", ...attrs}) {
	return <T className={`ms3-additional-container ${className}`} {...attrs} />;
}

export default AdditionalContainer;
