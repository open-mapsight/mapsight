import {forwardRef, Fragment, memo, useRef} from "react";

import FeatureListContent from "./content";
import {useFeatureListContext} from "./context";
import useFeatureListItemGroups from "./hooks/useFeatureListItemGroups";
import useKeyboardNavigation from "./hooks/useKeyboardNavigation";

function FeatureListGroupedContent(
	{as: T = "div", groupAs = null, itemAs, ...listProps},
	forwardedRef,
) {
	const ownRef = useRef();
	const ref = forwardedRef || ownRef;

	const {
		state: {filteredFeatures: features = []},
		itemProps,
		enableKeyboardControl,
	} = useFeatureListContext();
	const rootProps = {
		...useKeyboardNavigation(enableKeyboardControl, ref),
		ref: ref,
	};

	listProps.emptyAs = itemProps.as;

	// we have to separate calculation of items from wrapping them,
	// as the outer tags depend on restProps, and we do not want to recreate list items on changes to restProps.
	const itemGroups = useFeatureListItemGroups(
		groupAs,
		features,
		itemAs,
		itemProps,
	);

	if (!features.length) {
		return <FeatureListContent {...listProps} {...rootProps} />;
	}

	if (itemGroups.groups) {
		const GroupNameT = groupAs;

		return (
			<T className="ms3-list-groups ms3-scroll-target" {...rootProps}>
				{itemGroups.groups.map(function composeGroup(group, index) {
					return (
						<Fragment key={group.name}>
							{group.name ? (
								<GroupNameT className="ms3-list__group ms3-list__group--name">
									{group.name}
								</GroupNameT>
							) : null}

							<FeatureListContent
								data-ms3-group-name={group.name}
								{...listProps}
							>
								{itemGroups.items[index]}
							</FeatureListContent>
						</Fragment>
					);
				})}
			</T>
		);
	}

	return (
		<FeatureListContent {...listProps} {...rootProps}>
			{itemGroups.items[0]}
		</FeatureListContent>
	);
}

export default memo(forwardRef(FeatureListGroupedContent));
