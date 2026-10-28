import {translate} from "../../helpers/i18n";
import type {Props} from "../query-input-with-label";
import QueryInputWithLabel from "../query-input-with-label";

function FeatureQueryInput(
	props: Omit<Props, "label"> & {label?: Props["label"]},
) {
	return (
		<QueryInputWithLabel
			label={translate("ui.feature-list.query-input.placeholder")}
			// placeholder={translate("ui.feature-list.query-input.placeholder")}
			{...props}
		/>
	);
}

export default FeatureQueryInput;
