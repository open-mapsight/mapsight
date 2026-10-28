import type {PolymorphicProps} from "../../polymorphic-props";

function Marginal({
	as: T = "div",
	position,
	className = "",
	...attrs
}: PolymorphicProps & {position: "left" | "right" | "top" | "bottom"}) {
	return (
		<T
			className={`ms3-marginal ms3-marginal--${position} ${className}`}
			{...attrs}
		/>
	);
}

export default Marginal;
