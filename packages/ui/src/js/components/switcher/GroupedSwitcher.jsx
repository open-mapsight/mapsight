import {Fragment, memo} from "react";

import Switcher from "./Switcher";

function GroupedSwitcher(props) {
	const {
		as: T = "div",
		className = "ms3-grouped-switcher",
		renderEntry,
		renderHeader = undefined,
		ungroupedIds = [],
		groupedIds = {},
		...attributes
	} = props;

	const children = Object.entries(groupedIds).map(([key, group]) => (
		<Switcher
			key={key}
			ids={group}
			group={key}
			as={Fragment}
			renderEntry={renderEntry}
			renderHeader={renderHeader}
		/>
	));

	return (
		<T className={className} {...attributes}>
			{ungroupedIds.length !== 0 && (
				<Switcher
					ids={ungroupedIds}
					as={Fragment}
					renderEntry={renderEntry}
					renderHeader={renderHeader}
				/>
			)}
			{children}
		</T>
	);
}

export default memo(GroupedSwitcher);
