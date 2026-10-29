import type {PolymorphicProps} from "../polymorphic-props";

function MapRow({as: T = "div", ...props}: PolymorphicProps) {
	return <T className="ms3-map-row" {...props} />;
}

export default MapRow;
