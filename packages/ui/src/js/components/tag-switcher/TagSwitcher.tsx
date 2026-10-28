import {type ElementType, memo, useMemo} from "react";

import {getDocumentLanguage} from "../../helpers/i18n";
import GroupedSwitcher from "../switcher/GroupedSwitcher";
import createTagSwitcherEntry from "./createTagSwitcherEntry";
import createTagSwitcherHeader from "./createTagSwitcherHeader";

export type TagSwitcherProps = {
	groupedTagData?: Record<
		string,
		{tags: Record<string, number>; count: number}
	>;
	featureSourceId: string;
	toggleableGroups?: boolean;
	sortTags?: boolean;
	headlineAs?: ElementType;
};

function TagSwitcher({
	groupedTagData,
	featureSourceId,
	toggleableGroups = false,
	sortTags = true,
	headlineAs,
}: TagSwitcherProps) {
	function renderEntry(id, group) {
		const E = createTagSwitcherEntry(featureSourceId, group, id);
		return <E key={id} count={groupedTagData?.[group]?.tags[id]} />;
	}

	function renderHeader(group, props) {
		const H = createTagSwitcherHeader(featureSourceId, group);
		return (
			<H
				{...props}
				count={groupedTagData?.[group]?.count}
				toggleable={toggleableGroups}
			/>
		);
	}

	const locale = getDocumentLanguage();

	const groupedIds = useMemo(() => {
		// Object.fromEntries needs babel runtime core3
		const groupedIdsTmp = {};
		if (!groupedTagData) {
			return groupedIdsTmp;
		}
		Object.keys(groupedTagData).forEach((group) => {
			groupedIdsTmp[group] = Object.keys(
				groupedTagData[group]?.tags ?? {},
			);
			if (sortTags) {
				groupedIdsTmp[group].sort((a, b) =>
					a.localeCompare(b, locale, {numeric: true}),
				);
			}
		});
		return groupedIdsTmp;
	}, [groupedTagData, sortTags, locale]);

	return (
		<GroupedSwitcher
			className="ms3-tag-switcher"
			headlineAs={headlineAs}
			groupedIds={groupedIds}
			renderEntry={renderEntry}
			renderHeader={renderHeader}
		/>
	);
}

export default memo(TagSwitcher);
