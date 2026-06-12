import {type ReactElement} from "react";

export function CsvDownloadLink({
	href,
	disabled,
}: {
	href: string;
	disabled?: boolean;
}): ReactElement {
	if (disabled) {
		return (
			<p className="msca:text-sm msca:text-gray-500">
				CSV-Export ist erst verfügbar, wenn die Auswahl gültig ist.
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
				Als CSV-Datei herunterladen
			</a>
		</p>
	);
}
