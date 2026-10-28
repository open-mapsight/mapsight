import {translate} from "../../helpers/i18n";
import type {PolymorphicProps} from "../polymorphic-props";

function FeatureListEmptyMessage({
	hasSource,
	as: T = "div",
	...attributes
}: PolymorphicProps & {hasSource: boolean}) {
	const emptyMessage = hasSource
		? translate("ui.feature-list.content.noEntries")
		: translate("ui.feature-list.content.noListSelected");

	return (
		<T className="ms3-list__empty" {...attributes}>
			{emptyMessage}
		</T>
	);
}

export default FeatureListEmptyMessage;
