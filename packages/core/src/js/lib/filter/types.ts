import type {Feature} from "@/types";

/** Runtime filter slice state; shape depends on the filter implementation. */
export type FilterState = unknown;

export type FiltersState = Record<string, FilterState>;

export type FilterFunction = (
	features: Array<Feature>,
	filterState: FilterState,
	featureSourceId: string,
) => Array<Feature>;
