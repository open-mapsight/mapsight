import type {ForwardedRef} from "react";
import {forwardRef} from "react";

import {translate} from "../../helpers/i18n";
import type {Props} from "../query-input";
import QueryInput from "../query-input";

function SearchQueryInput(
	props: Omit<Props, "label"> & {label?: Props["label"]},
	ref: ForwardedRef<HTMLInputElement>,
) {
	return (
		<QueryInput
			ref={ref}
			className="ms3-search__input"
			groupClassName="ms3-search__input-group"
			resetButtonClassName="ms3-search__reset-button"
			label={translate("ui.search.query-input.label")}
			placeholder={translate("ui.search.query-input.placeholder")}
			{...props}
		/>
	);
}

export default forwardRef(SearchQueryInput);
