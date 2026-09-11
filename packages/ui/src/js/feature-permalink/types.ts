import type {MapsightUiFeature} from "../types";

/**
 * Schema.org-shaped group on `feature.properties.schema`.
 *
 * `@type` defaults to `Place` in resolvers / JSON-LD builders. Do not stamp
 * `"@type": "Place"` onto features that already have `url`, `telephone`, or
 * host-marked `sameAs`. Extra schema.org keys are allowed on the file and
 * ignored in v1.
 */
export type FeatureSchema = {
	"@type"?: string;
	url?: string;
	telephone?: string;
	sameAs?: string | string[];
};

export type FeatureLocation = {
	origin: string;
	pathname: string;
	search?: string;
};

export type FeaturePermalinkResolveContext = {
	location: FeatureLocation | null;
};

export type FeaturePermalinkConfig = {
	permalink?:
		| string
		| ((
				feature: MapsightUiFeature,
				ctx: FeaturePermalinkResolveContext,
		  ) => string | null | undefined);
	/** Used when `permalink` is omitted and `permanentLink` is unset. */
	location?: FeatureLocation | null;
	/** Default: `feature.properties.schema`. */
	schema?: (feature: MapsightUiFeature) => FeatureSchema | null | undefined;
	/**
	 * Collection `mapsight.schemaDefault` when the whole layer is not Place.
	 * Features override via `properties.schema`.
	 */
	schemaDefault?: FeatureSchema | null;
	/**
	 * Owning catalog feature-source id. Written as `?src=` when it is not
	 * implied by the landing view.
	 */
	featureSourceId?:
		| string
		| ((
				feature: MapsightUiFeature,
				ctx: FeaturePermalinkResolveContext,
		  ) => string | null | undefined);
	/**
	 * Source ids the recipient already loads for this URL (module defaults
	 * or host `layerVisible`). Those ids are omitted from `?src=`.
	 */
	impliedFeatureSourceIds?:
		| readonly string[]
		| ((
				feature: MapsightUiFeature,
				ctx: FeaturePermalinkResolveContext,
		  ) => readonly string[]);
};
