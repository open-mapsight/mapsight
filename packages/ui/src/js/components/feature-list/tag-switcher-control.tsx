import {memo} from "react";

import {translate} from "../../helpers/i18n";
import FilterToggleControl from "../filter-toggle-control/FilterToggleControl";
import TagSwitcher from "../tag-switcher/index";

function FeatureListTagSwitcherControl() {
	return (
		<FilterToggleControl
			buttonClassName="ms3-filter-button--icon-tags"
			buttonActiveClassName="ms3-filter-button--icon-tags-active"
			title={translate("ui.feature-list.tag-switcher.announcements")}
		>
			<TagSwitcher />
		</FilterToggleControl>
	);
}

export default memo(FeatureListTagSwitcherControl);
