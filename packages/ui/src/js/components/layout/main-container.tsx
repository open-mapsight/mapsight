import type {PolymorphicProps} from "../polymorphic-props";

function MainContainer({as: T = "div", ...props}: PolymorphicProps) {
	return <T className="ms3-main-container" {...props} />;
}

export default MainContainer;
