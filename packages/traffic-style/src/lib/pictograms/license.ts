import type {PictogramSource} from "./types.ts";

export type PictogramSourceLicense = {
	source: PictogramSource;
	title: string;
	license: string;
	licenseUrl: string;
	homepageUrl: string;
	modificationNotice: Record<string, string>;
	creator?: string;
};

const FONT_AWESOME_LICENSE: PictogramSourceLicense = {
	source: "fontawesome",
	title: "Font Awesome",
	license: "CC BY 4.0",
	licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
	homepageUrl: "https://fontawesome.com",
	modificationNotice: {
		de: "Darstellung verändert.",
		en: "adapted.",
	},
	creator: "Fonticons, Inc. / Dave Gandy",
};

const LICENSES: Partial<Record<PictogramSource, PictogramSourceLicense>> = {
	fontawesome: FONT_AWESOME_LICENSE,
};

/** License for a pictogram pack. Traffic-style native pictograms are uncredited. */
export function getPictogramSourceLicense(
	source: PictogramSource,
): PictogramSourceLicense | undefined {
	return LICENSES[source];
}
