import {Fragment, memo} from "react";

import type {SwitcherProps} from "./Switcher";
import Switcher from "./Switcher";

export type GroupedSwitcherProps = Omit<SwitcherProps, "ids" | "group"> & {
	ungroupedIds?: string[];
	groupedIds?: Record<string, string[]>;
};

function GroupedSwitcher(props: GroupedSwitcherProps) {
	const {
		as: T = "div",
		className = "ms3-grouped-switcher",
		renderEntry,
		headlineAs,
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
			headlineAs={headlineAs}
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
					headlineAs={headlineAs}
				/>
			)}
			{children}
		</T>
	);
}

export default memo(GroupedSwitcher);
