import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {setTagGroupVisible} from "../../store/actions.ts";
import {createTagGroupVisibleSelector} from "../../store/selectors.ts";
import SwitcherHeader from "../switcher/SwitcherHeader";

export default function createTagSwitcherHeader(featureSourceId, tagGroup) {
	return connect(
		createStructuredSelector({
			visibility: createTagGroupVisibleSelector(
				featureSourceId,
				tagGroup,
			),
		}),
		null,
		({visibility}, {dispatch}, {toggleable = false, ...ownProps}) => ({
			label: tagGroup,
			active: !toggleable || visibility,
			toggleActive: toggleable
				? () =>
						dispatch(
							setTagGroupVisible(
								featureSourceId,
								tagGroup,
								!visibility,
							),
						)
				: undefined,
			...ownProps,
		}),
	)(SwitcherHeader);
}
