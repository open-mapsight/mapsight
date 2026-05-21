import {connect} from "react-redux";

import {
	featureDetailsHasErrorSelector,
	featureDetailsHtmlSelector,
	isEmbeddedMapSelector,
	viewSelector,
} from "../../store/selectors";
import FeatureDetailsContent from "./feature-details-content";

export default connect((state) => ({
	view: viewSelector(state),
	isEmbeddedMap: isEmbeddedMapSelector(state),
	hasError: featureDetailsHasErrorSelector(state),
	html: featureDetailsHtmlSelector(state),
}))(FeatureDetailsContent);
