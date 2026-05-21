import {connect} from "react-redux";

import {setTagVisible} from "../../store/actions";
import type {RootStateSlice} from "../../store/selectors";
import {createTagVisibleSelector} from "../../store/selectors";
import SwitcherEntry from "../switcher/SwitcherEntry";

export default function createTagSwitcherEntry(
	featureSourceId: string,
	tagGroup: string,
	tagName: string,
) {
	const visibilitySelector = createTagVisibleSelector(
		featureSourceId,
		tagGroup,
		tagName,
	);

	return connect(
		(state: RootStateSlice) => ({
			visibility: visibilitySelector(state),
		}),
		null,
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
