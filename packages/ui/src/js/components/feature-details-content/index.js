import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {
	featureDetailsHasErrorSelector,
	featureDetailsHtmlSelector,
	isEmbeddedMapSelector,
	viewSelector,
} from "../../store/selectors.ts";
import FeatureDetailsContent from "./feature-details-content";

export default connect(
	createStructuredSelector({
		view: viewSelector,
		isEmbeddedMap: isEmbeddedMapSelector,
		hasError: featureDetailsHasErrorSelector,
		html: featureDetailsHtmlSelector,
	}),
)(FeatureDetailsContent);
