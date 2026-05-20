import {connect} from "react-redux";

import type {RootStateSlice} from "../../store/selectors";
import {
	tagSwitcherFeatureSourceIdSelector,
	tagSwitcherSortTags,
	tagSwitcherTagsSelector,
	tagSwitcherToggleableGroups,
} from "../../store/selectors";
import TagSwitcher from "./TagSwitcher";

export default connect((state: RootStateSlice) => ({
	featureSourceId: tagSwitcherFeatureSourceIdSelector(state),
	groupedTagData: tagSwitcherTagsSelector(state),
	toggleableGroups: tagSwitcherToggleableGroups(state),
	sortTags: tagSwitcherSortTags(state),
}))(TagSwitcher);
