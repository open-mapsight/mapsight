import {parseMapsightIcon} from "@mapsight/traffic-style/icon";
import {
	type PictogramSourceLicense,
	getPictogramSourceLicense,
	pictogramPackForIconId,
} from "@mapsight/traffic-style/pictograms";

/** Compact `mapsightIconId` values → unique pictogram-source licenses in play. */
export function pictogramAttributionsFromIconIds(
	iconIds: readonly (string | null | undefined)[],
): PictogramSourceLicense[] {
	const licenses = new Map<string, PictogramSourceLicense>();

	for (const value of iconIds) {
		if (typeof value !== "string" || !value.trim()) {
			continue;
		}

		const spec = parseMapsightIcon(value);
		const pictogramId = spec?.pictogram;
		if (!pictogramId) {
			continue;
		}

		const license = getPictogramSourceLicense(
			pictogramPackForIconId(pictogramId),
		);
		if (license) {
			licenses.set(license.source, license);
		}
	}

	return [...licenses.values()];
}
