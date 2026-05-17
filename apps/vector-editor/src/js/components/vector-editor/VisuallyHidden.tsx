import type React from "react";

function VisuallyHidden({
	as: T = "span",
	className = "",
	children = null,
}: {
	as?: React.ElementType;
	className?: string;
	children?: React.ReactNode;
}) {
	return <T className={"visuallyhidden " + className}>{children}</T>;
}

export default VisuallyHidden;
