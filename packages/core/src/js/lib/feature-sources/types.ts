import type {FeatureSourceDataHistory} from "@/lib/feature-sources/lib/history";
import type {
	FeatureSourceConfig,
	FeatureSourcesConfig,
} from "@/lib/feature-sources/schema";
import type {Feature, FeatureId} from "@/types";

export type {FeatureSourceConfig, FeatureSourcesConfig};

export type FeatureSourceData = {
	type?: "FeatureCollection";
	features?: Array<Feature>;
};

export type FeatureSourceType = FeatureSourceState["type"];

export interface FeatureSourceState extends FeatureSourceConfig {
	data: FeatureSourceData | null;
	/** Fingerprint of `data.features`; unchanged when only collection metadata polls. */
	featuresKey?: string;
	/** `data.features.length` at the last write; used to skip stringify on count changes. */
	featuresCount?: number;
	ids?: Array<FeatureId>;
	featuresById?: Record<FeatureId, Feature>;
	error?: string;
	lastUpdate: number | null;
	lastActionType: string | null;
	isLoading?: boolean;
	requestId?: number;
	refreshPaused?: boolean;
	dataHistory?: FeatureSourceDataHistory;
}

export type FeatureSourceConfigState = FeatureSourceConfig &
	Partial<
		Pick<
			FeatureSourceState,
			"data" | "ids" | "featuresById" | "lastUpdate" | "lastActionType"
		>
	>;

export type FeatureSourcesConfigState = Record<
	string,
	FeatureSourceConfigState
>;

export type FeatureSourcesState = Record<string, FeatureSourceState>;

export type FeatureSourceDataSnapshot = {
	data: FeatureSourceState["data"];
	lastUpdate: number | null;
	lastActionType: string | null;
};
