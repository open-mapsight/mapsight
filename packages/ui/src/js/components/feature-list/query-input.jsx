import {translate} from "../../helpers/i18n";
import QueryInputWithLabel from "../query-input-with-label";

function FeatureQueryInput(props) {
	return (
		<QueryInputWithLabel
			label={translate("ui.feature-list.query-input.placeholder")}
			// placeholder={translate("ui.feature-list.query-input.placeholder")}
			{...props}
		/>
	);
}

export default FeatureQueryInput;
