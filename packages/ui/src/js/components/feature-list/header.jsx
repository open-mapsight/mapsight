import  {forwardRef} from "react";

function FeatureListHeader({as: T = "div", ...attributes}, ref) {
	return <T className="ms3-list-header" ref={ref} {...attributes} />;
}

export default forwardRef(FeatureListHeader);
