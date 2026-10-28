import type {PolymorphicProps} from "../../polymorphic-props";

function AdditionalContainer({
	as: T = "div",
	className = "",
	...attrs
}: PolymorphicProps) {
	return <T className={`ms3-additional-container ${className}`} {...attrs} />;
}

export default AdditionalContainer;
