import type {
	StationTypeCategory,
	StationTypeSummary,
} from "@mapsight/count-aggregator-api";

export interface StationTypeCategoryGroup {
	category: StationTypeCategory;
	stationTypes: StationTypeSummary[];
}

export function groupStationTypesByCategory(
	stationTypes: readonly StationTypeSummary[],
): StationTypeCategoryGroup[] {
	const groups = new Map<string, StationTypeCategoryGroup>();

	for (const entry of stationTypes) {
		const category = entry.category;
		const existingGroup = groups.get(category.id);

		if (existingGroup === undefined) {
			groups.set(category.id, {
				category,
				stationTypes: [entry],
			});
			continue;
		}

		existingGroup.stationTypes.push(entry);
	}

	return Array.from(groups.values());
}
