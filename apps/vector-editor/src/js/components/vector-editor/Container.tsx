import type React from "react";

const Container = ({
	as: T = "div",
	className = "",
	panelConfiguration,
	...props
}: {
	children?: React.ReactNode;
	as?: React.ElementType;
	className?: string;
	panelConfiguration: string;
}) => (
	<T
		className={`ms3-vector-editor-container ms3-vector-editor-container--panel-configuration-${panelConfiguration} ${className}`}
		{...props}
	/>
);

export default Container;
