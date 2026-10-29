import type {ElementType} from "react";
import {useSelector} from "react-redux";

import {Heading, useHeadingElement} from "../../headings";
import {makeReplaceableComponent} from "../../helpers/components";
import {titleSelector} from "../../store/selectors";

export type TitleBarProps = {headlineAs?: ElementType};

function TitleBar({headlineAs}: TitleBarProps) {
	const title = useSelector(titleSelector);
	const Headline = useHeadingElement("appTitle", headlineAs);

	return (
		<div className="ms3-flex ms3-flex--row ms3-flex-no-shrink">
			<div className="ms3-page-title ms3-flex-grow ms3-page-title--automatic-headings">
				{title && (
					<Heading as={Headline} className="ms3-page-title__headline">
						{title}
					</Heading>
				)}
			</div>
		</div>
	);
}

export default makeReplaceableComponent("TitleBar", TitleBar);
export {TitleBar as NonReplaceableTitleBar};

declare module "../../helpers/components" {
	interface ComponentProps {
		TitleBar: TitleBarProps;
	}
}
