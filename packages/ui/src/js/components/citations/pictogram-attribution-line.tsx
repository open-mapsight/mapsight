import type {PictogramSourceLicense} from "@mapsight/traffic-style/pictograms";

import {getDocumentLanguage, translate} from "../../helpers/i18n";

export default function PictogramAttributionLine({
	license,
}: {
	license: PictogramSourceLicense;
}) {
	const language = getDocumentLanguage();
	const notice =
		license.modificationNotice[language] ??
		license.modificationNotice.en ??
		"";

	return (
		<li className="ms3-attribution__entry ms3-citations__pictogram">
			{translate("ui.citations.pictograms")}:{" "}
			<a href={license.homepageUrl}>{license.title}</a> (
			<a href={license.licenseUrl}>{license.license}</a>), {notice}
		</li>
	);
}
