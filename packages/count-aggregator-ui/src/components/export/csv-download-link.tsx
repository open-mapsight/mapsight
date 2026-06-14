import {type ReactElement} from "react";

import {useCountAggregatorI18n} from "../../context/count-aggregator-provider.js";

export function CsvDownloadLink({
	href,
	disabled,
}: {
	href: string;
	disabled?: boolean;
}): ReactElement {
	const {t} = useCountAggregatorI18n();

	if (disabled) {
		return (
			<p className="msca:text-sm msca:text-gray-500">
				{t("csv.disabled")}
			</p>
		);
	}

	return (
		<p>
			<a
				className="msca:underline msca:hover:text-[var(--msca-color-primary)]"
				href={href}
				target="_blank"
				rel="download noreferrer"
			>
				{t("csv.download")}
			</a>
		</p>
	);
}
