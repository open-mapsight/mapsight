import type React from "react";

const MapOverlay = ({
	as: T = "div",
	className = "",
	...props
}: {
	children?: React.ReactNode;
	as?: React.ElementType;
	className?: string;
}) => <T className={`ms3-map-overlay ${className}`} {...props} />;

export default MapOverlay;
