import type {ElementType} from "react";

import Button from "./Button.tsx";

function UndoButton({
	as: T = Button,
	enabled,
	className = "",
	onClick,
	attributes = {},
}: {
	as?: ElementType;
	enabled: boolean;
	className?: string;
	onClick: () => void;
	attributes?: any;
}) {
	return (
		<T
			disabled={!enabled}
			className={`ms3-vector-undo-button ${
				!enabled
					? "ms3-vector-undo-button--disabled"
					: "ms3-vector-undo-button--enabled"
			} ${className}`}
			onClick={onClick}
			icon="icon-undo"
			label="Änderung widerrufen"
			{...attributes}
		/>
	);
}

export default UndoButton;
