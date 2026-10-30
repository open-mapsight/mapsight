import type {PolymorphicProps} from "../polymorphic-props";

function FeatureListFooter({as: T = "div", ...attributes}: PolymorphicProps) {
	return <T className="ms3-list-footer" {...attributes} />;
}

export default FeatureListFooter;
