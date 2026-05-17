import type {ClassAttributes, HTMLAttributes} from "react";
import type {JSX} from "react/jsx-runtime";

function ButtonLabel(
	props: JSX.IntrinsicAttributes &
		ClassAttributes<HTMLSpanElement> &
		HTMLAttributes<HTMLSpanElement>,
) {
	return <span className="ms3-vector-editor-button__label" {...props} />;
}

export default ButtonLabel;
