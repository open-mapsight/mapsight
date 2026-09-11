import type {MapsightUiFeature} from "../../types";

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

export type PlaceActionsLocation = {
	origin: string;
	pathname: string;
	search?: string;
};

export type PlaceActionsResolveContext = {
	location: PlaceActionsLocation | null;
};

export type BuiltInNavTargetId = "geo" | "google" | "apple";

export type CustomNavHrefContext = {
	feature: MapsightUiFeature;
	lon: number | null;
	lat: number | null;
	address: string | null;
};

export type CustomNavHref =
	string | ((ctx: CustomNavHrefContext) => string | null | undefined);

export type CustomNavTarget = {
	id: string;
	label: string;
	href: CustomNavHref;
	/** Used by the map-point “from here” menu when the point is the origin. */
	originHref?: CustomNavHref;
};

export type NavigationTarget = BuiltInNavTargetId | CustomNavTarget;

export type PlaceActionsConfig = {
	permalink?:
		| string
		| ((
				feature: MapsightUiFeature,
				ctx: PlaceActionsResolveContext,
		  ) => string | null | undefined);
	/** Used when `permalink` is omitted and `permanentLink` is unset. */
	location?: PlaceActionsLocation | null;
	/** Default: `feature.properties.schema`. */
	schema?: (feature: MapsightUiFeature) => FeatureSchema | null | undefined;
	/**
	 * Collection `mapsight.schemaDefault` when the whole layer is not Place.
	 * Features override via `properties.schema`.
	 */
	schemaDefault?: FeatureSchema | null;
	navigation?: {
		fromGeometry?: boolean;
		address?: string | ((feature: MapsightUiFeature) => string | null);
		targets?: NavigationTarget[];
		/**
		 * Override `geo:` capability. Default: Client Hint / mobile UA.
		 * There is no protocol-handler feature API.
		 */
		supportsGeo?: boolean | (() => boolean);
	};
	share?: {title?: string | ((feature: MapsightUiFeature) => string)};
	/** Default: show when the feature has a point or bbox. */
	showOnMap?: boolean;
	/**
	 * Default: only the shared `link-marker`. Set `true` to show for any
	 * point, or `false` to hide it even on the marker.
	 */
	copyCoords?: boolean;
};

export type ResolvedNavTarget = {
	id: string;
	label: string;
	href: string;
	originHref?: string;
};

export type SharePlaceAction = {
	kind: "share";
	href: string;
	title: string;
};

export type ShowOnMapPlaceAction = {
	kind: "showOnMap";
};

export type CopyCoordsPlaceAction = {
	kind: "copyCoords";
	text: string;
};

export type NavigatePlaceAction = {
	kind: "navigate";
	targets: ResolvedNavTarget[];
};

export type WebsitePlaceAction = {
	kind: "website";
	href: string;
};

export type CallPlaceAction = {
	kind: "call";
	href: string;
	telephone: string;
};

export type PlaceAction =
	| SharePlaceAction
	| CopyCoordsPlaceAction
	| ShowOnMapPlaceAction
	| NavigatePlaceAction
	| WebsitePlaceAction
	| CallPlaceAction;
