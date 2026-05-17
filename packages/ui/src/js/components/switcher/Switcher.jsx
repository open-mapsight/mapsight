import {Fragment, memo} from "react";

import SwitcherHeader from "./SwitcherHeader";

const defaultRenderHeader = (label, props) => (
	<SwitcherHeader label={label} {...props} />
);

function Switcher(props) {
	const {
		as: T = "div",
		headlineAs = "h3",
		entriesAs: V = "ul",
		baseClass = "ms3-layer-switcher", // TODO: Move to generic class name
		renderEntry,
		renderHeader = defaultRenderHeader,
		ids = [],
		group = null,
		headerAttributes: headerAttributes_ = {},
		entriesAttributes: entriesAttributes_ = {},
		...attributes
	} = props;

	const headerAttributes = {...headerAttributes_};
	const entriesAttributes = {...entriesAttributes_};

	attributes.className = `${baseClass} ${attributes.className || ""}`;
	headerAttributes.className = `${baseClass}__header ${
		headerAttributes.className || ""
	}`;
	entriesAttributes.className = `${baseClass}__entries ${
		entriesAttributes.className || ""
	}`;

	if (group) {
		attributes["data-ms3-switcher-group"] = group;
		headerAttributes["data-ms3-switcher-header-group"] = group;
		entriesAttributes["data-ms3-switcher-entries-group"] = group;
	}

	return (
		<T {...(T === Fragment ? {} : attributes)}>
			{group
				? renderHeader(group, {as: headlineAs, ...headerAttributes})
				: null}

			<V {...entriesAttributes}>
				{ids.map((id) => renderEntry(id, group))}
			</V>
		</T>
	);
}

export default memo(Switcher);
