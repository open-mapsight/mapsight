import type React from "react";

const Controls = ({
	as: T = "div",
	className = "",
	...props
}: {
	children?: React.ReactNode;
	as?: React.ElementType;
	className?: string;
}) => <T className={`ms3-vector-editor-controls ${className}`} {...props} />;

export default Controls;
