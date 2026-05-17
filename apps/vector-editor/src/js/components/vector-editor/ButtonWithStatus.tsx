import type {ButtonProps} from "./Button.tsx";
import Button from "./Button.tsx";

export type ButtonWithStatusProps = ButtonProps & {
	isActive?: boolean;
};

const ButtonWithStatus = ({
	className = "",
	isActive = false,
	...props
}: ButtonWithStatusProps) => (
	<Button
		className={`${
			isActive
				? "ms3-vector-editor-button--active"
				: "ms3-vector-editor-button--inactive"
		} ${className}`}
		{...props}
	/>
);

export default ButtonWithStatus;
