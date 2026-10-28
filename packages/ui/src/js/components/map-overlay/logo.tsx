import {makeReplaceableComponent} from "../../helpers/components";
import {getDocumentLanguage, translate} from "../../helpers/i18n";

export const ATTRIBUTION_URL = "https://open-mapsight.org/";

// The mark exists in German and English. Other languages fall back to the
// German default, like the UI dictionary does.
function attributionLanguage(language: string): "de" | "en" {
	return language.toLowerCase().split(/[-_]/)[0] === "en" ? "en" : "de";
}

function MapOverlayLogo() {
	const language = attributionLanguage(getDocumentLanguage());

	return (
		<a
			className={`ms3-logo ms3-logo--${language}`}
			href={ATTRIBUTION_URL}
			rel="external noreferrer noopener"
		>
			<span className="ms3-visuallyhidden">
				{translate("ui.map-overlay.logo.copyright")}
			</span>
		</a>
	);
}

export default makeReplaceableComponent("MapOverlayLogo", MapOverlayLogo);
export {MapOverlayLogo as NonReplaceableMapOverlayLogo};

declare module "../../helpers/components" {
	interface ComponentProps {
		MapOverlayLogo: Record<string, never>;
	}
}
