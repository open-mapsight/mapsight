import {type ReactElement, type ReactNode, memo} from "react";

import {useCountAggregatorConfig} from "../../context/count-aggregator-provider.js";

export const Section = memo(function Section({
	title,
	titleClassName = "msca:mb-2 msca:text-base msca:font-bold",
	children,
}: {
	title: string;
	titleClassName?: string;
	children?: ReactNode;
}): ReactElement {
	const {sectionHeadingAs: Heading = "h4"} = useCountAggregatorConfig();

	return (
		<div className="msca:mb-6">
			<Heading className={titleClassName}>{title}</Heading>
			<fieldset className="msca:ml-5">
				<legend className="msca:sr-only">{title}</legend>
				<div className="msca:space-y-2">{children}</div>
			</fieldset>
		</div>
	);
});
