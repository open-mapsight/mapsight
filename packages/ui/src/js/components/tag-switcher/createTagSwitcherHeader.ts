import {connect} from "react-redux";

import {setTagGroupVisible} from "../../store/actions";
import {
	type RootStateSlice,
	createTagGroupVisibleSelector,
} from "../../store/selectors";
import SwitcherHeader from "../switcher/SwitcherHeader";

type Props = {
	toggleable?: boolean;
};

export default function createTagSwitcherHeader(
	featureSourceId: string,
	tagGroup: string,
) {
	const visibilitySelector = createTagGroupVisibleSelector(
		featureSourceId,
		tagGroup,
	);
	return connect(
		(state: RootStateSlice) => ({
			visibility: visibilitySelector(state),
		}),
		null,
		(
			{visibility},
			{dispatch},
			{toggleable = false, ...ownProps}: Props,
		) => ({
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
