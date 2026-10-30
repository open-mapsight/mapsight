import type {HTMLAttributes} from "react";

function Container({
	children,
	className = "",
	...attrs
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={`ms3-feature-selection-info ${className}`} {...attrs}>
			{children}
		</div>
	);
}

export default Container;
