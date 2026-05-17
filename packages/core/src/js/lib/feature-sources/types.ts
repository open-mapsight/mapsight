import type {FeatureSourceDataHistory} from "@/lib/feature-sources/lib/history";
import type {Feature, FeatureId} from "@/types";

export type FeatureSourceData = {
	type?: "FeatureCollection";
	features?: Array<Feature>;
};

export type FeatureSourceType = FeatureSourceState["type"];

export interface FeatureSourceState {
	type: "local" | "xhr-json" | "noop";
	data: FeatureSourceData | null;
	// TODO: replace the full scan with something smarter (eg bisecting a sorted list)
	ids?: Array<FeatureId>;
	filters?: Array<string>;
	error?: string;
	url?: string;
	lastUpdate: number | null;
	lastActionType: string | null;
	isLoading?: boolean;
	requestId?: number;
	doRefresh?: boolean;
	refreshPaused?: boolean;
	timer?: number;
	enableHistory?: boolean;
	dataHistory?: FeatureSourceDataHistory;
}

export type FeatureSourcesState = Record<string, FeatureSourceState>;

export type FeatureSourceDataSnapshot = {
	data: FeatureSourceState["data"];
	lastUpdate: number | null;
	lastActionType: string | null;
};
