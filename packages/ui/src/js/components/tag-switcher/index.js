import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {
	tagSwitcherFeatureSourceIdSelector,
	tagSwitcherSortTags,
	tagSwitcherTagsSelector,
	tagSwitcherToggleableGroups,
} from "../../store/selectors.ts";
import TagSwitcher from "./TagSwitcher";

export default connect(
	createStructuredSelector({
		featureSourceId: tagSwitcherFeatureSourceIdSelector,
		groupedTagData: tagSwitcherTagsSelector,
		toggleableGroups: tagSwitcherToggleableGroups,
		sortTags: tagSwitcherSortTags,
	}),
)(TagSwitcher);
