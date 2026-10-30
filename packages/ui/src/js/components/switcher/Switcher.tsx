import type {ElementType, ReactNode} from "react";
import {Fragment, memo} from "react";

import {HeadingContent, useHeadingElement} from "../../headings";
import type {PolymorphicProps} from "../polymorphic-props";
import type {SwitcherHeaderProps} from "./SwitcherHeader";
import SwitcherHeader from "./SwitcherHeader";

export type SwitcherProps = PolymorphicProps & {
	headlineAs?: ElementType;
	entriesAs?: ElementType;
	baseClass?: string;
	renderEntry: (id: string, group: string | null) => ReactNode;
	renderHeader?: (
		label: string,
		props: Omit<SwitcherHeaderProps, "label">,
	) => ReactNode;
	ids?: string[];
	group?: string | null;
	headerAttributes?: Omit<SwitcherHeaderProps, "label"> &
		Record<`data-${string}`, unknown>;
	entriesAttributes?: PolymorphicProps & Record<`data-${string}`, unknown>;
};

const defaultRenderHeader = (
	label: string,
	props: Omit<SwitcherHeaderProps, "label">,
) => <SwitcherHeader label={label} {...props} />;

function Switcher(props: SwitcherProps) {
	const {
		as: T = "div",
		headlineAs,
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
	const Headline = useHeadingElement("switcher", "h3", headlineAs);

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
				? renderHeader(group, {as: Headline, ...headerAttributes})
				: null}

			<HeadingContent headingAs={group ? Headline : undefined}>
				<V {...entriesAttributes}>
					{ids.map((id) => renderEntry(id, group))}
				</V>
			</HeadingContent>
		</T>
	);
}

export default memo(Switcher);
