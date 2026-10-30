import type {MouseEventHandler, ReactNode} from "react";
import {Fragment, memo} from "react";

import {Heading, useHeadingElement} from "../../headings";
import type {PolymorphicProps} from "../polymorphic-props";
import SwitcherButton from "./SwitcherButton";

export type SwitcherHeaderProps = PolymorphicProps & {
	baseClass?: string;
	label: ReactNode;
	toggleActive?: MouseEventHandler<HTMLButtonElement> | null;
	active?: boolean;
	count?: number | null;
};

function SwitcherHeader(props: SwitcherHeaderProps) {
	const {
		as,
		baseClass = "ms3-switcher-header",
		label,
		toggleActive = null,
		active = true,
		count = null,
		...attributes
	} = props;
	const T = useHeadingElement("switcher", "h3", as);

	const activeClassModified = active ? "active" : "inactive";
	if (T !== Fragment) {
		attributes.className = `[ ${baseClass} ${baseClass}--${activeClassModified} ] ${
			attributes.className || ""
		}`;
	}

	if (toggleActive) {
		return (
			<Heading as={T} {...attributes}>
				<SwitcherButton
					status={activeClassModified}
					toggleActive={toggleActive}
					active={active}
				>
					<span className={`${baseClass}__label`}>{label}</span>

					{!!count && (
						<span
							className={`${baseClass}__count`}
							data-ms3-count={count}
						>
							{count}
						</span>
					)}
				</SwitcherButton>
			</Heading>
		);
	}

	return (
		<Heading as={T} {...attributes}>
			<span className={`${baseClass}__label`}>{label}</span>
			{!!count && (
				<span className={`${baseClass}__count`} data-ms3-count={count}>
					{count}
				</span>
			)}
		</Heading>
	);
}

export default memo(SwitcherHeader);
