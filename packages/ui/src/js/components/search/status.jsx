import {useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import useDebounce from "../../hooks/useDebounce";
import {
	searchQuerySelector,
	searchResultFeaturesSelector,
	searchStatusSelector,
} from "../../store/selectors";

export default function SearchStatus() {
	const query = useSelector(searchQuerySelector);
	const status = useSelector(searchStatusSelector);
	const features = useSelector(searchResultFeaturesSelector);
	let message = "";
	if (query) {
		if (status === "loading") {
			message = translate("ui.search.result.loading");
		} else if (status === "error") {
			message = translate("ui.search.result.error");
		} else if (status === "empty" || status === "found") {
			message = features.length
				? translate("ui.search.result.count").replace(
						"{count}",
						String(features.length),
					)
				: translate("ui.search.result.none");
		}
	}
	const debouncedMessage = useDebounce(message, 300);
	return (
		<div
			className="ms3-search__status ms3-visuallyhidden"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			{query ? debouncedMessage : ""}
		</div>
	);
}
