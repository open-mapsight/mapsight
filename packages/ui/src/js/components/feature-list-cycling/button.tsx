import type {ButtonHTMLAttributes, ReactNode} from "react";

function FeatureListCyclingButton({
	direction,
	label,
	...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	direction: "prev" | "next";
	label: ReactNode;
}) {
	return (
		<button
			type="button"
			className={`ms3-list-cycling-box__button ms3-list-cycling-box__button--${direction}`}
			{...rest}
		>
			<span className="ms3-visuallyhidden">{label}</span>
		</button>
	);
}

export default FeatureListCyclingButton;
