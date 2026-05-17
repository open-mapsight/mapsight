import type React from "react";

import Button from "./Button.tsx";
import Icon from "./Icon.tsx";
import VisuallyHidden from "./VisuallyHidden.tsx";

function RedoButton({
	as: T = Button,
	enabled,
	className = "",
	onClick,
	attributes = {},
}: {
	as?: React.ElementType;
	enabled: boolean;
	className?: string;
	onClick: () => void;
	attributes?: any;
}) {
	return (
		<T
			disabled={!enabled}
			className={`ms3-vector-redo-button ${
				!enabled
					? "ms3-vector-redo-button--disabled"
					: "ms3-vector-redo-button--enabled"
			} ${className}`}
			onClick={onClick}
			{...attributes}
		>
			<Icon name="icon-redo" />
			<VisuallyHidden>Änderung wiederholen</VisuallyHidden>
		</T>
	);
}

export default RedoButton;
