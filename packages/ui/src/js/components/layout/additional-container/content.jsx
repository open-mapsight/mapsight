import {makeReplaceableComponent} from "../../../helpers/components";

import "../host-slots";

/**
 * Default additional-container body. Hosts may replace via
 * `createOptions.components.AdditionalContainerContent`.
 *
 * @deprecated Host slot replacement is a migration aid. Prefer composing
 *   host UI outside replaceable slots where practical. May change in the next
 *   major of `@mapsight/ui`.
 */
function AdditionalContainerContent({
	as: T = "div",
	className = "",
	children,
	...attrs
}) {
	return (
		<T
			className={`ms3-additional-container__content ${className}`}
			{...attrs}
		>
			{children}
		</T>
	);
}

export default makeReplaceableComponent(
	"AdditionalContainerContent",
	AdditionalContainerContent,
);
