import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {setTagVisible} from "../../store/actions.ts";
import {createTagVisibleSelector} from "../../store/selectors.ts";
import SwitcherEntry from "../switcher/SwitcherEntry";

export default function createTagSwitcherEntry(
	featureSourceId,
	tagGroup,
	tagName,
) {
	return connect(
		// mapStateToProps:
		createStructuredSelector({
			visibility: createTagVisibleSelector(
				featureSourceId,
				tagGroup,
				tagName,
			),
		}),
		// mapDispatchToProps:
		null,
		// mergeProps:
		({visibility}, {dispatch}, {...ownProps}) => ({
			title: tagName,
			active: visibility,
			toggleActive: () =>
				dispatch(
					setTagVisible(
						featureSourceId,
						tagGroup,
						tagName,
						!visibility,
					),
				),
			...ownProps,
		}),
	)(SwitcherEntry);
}
