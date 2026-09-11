import Feature from "ol/Feature.js";
import type {ObjectWithGeometry} from "ol/Feature.js";
import type Geometry from "ol/geom/Geometry.js";

/**
 * Style / identity keys that belong on the OpenLayers feature bag.
 * Taken from simplestyle, traffic-style `attr()` / selectors, and live
 * Braunschweig GeoJSON (mapsightIconId, markerCaption*, occupancyTrendString).
 */
export const DEFAULT_CORE_PROPERTY_KEYS = [
	"id",
	"name",
	"title",
	"type",
	"state",
	"cluster",
	"clusterSize",
	"mapsightIconId",
	"markerCaption",
	"markerCaptionColor",
	"markerCaptionHalo",
	"marker-size",
	"marker-color",
	"marker-symbol",
	"stroke",
	"stroke-width",
	"stroke-opacity",
	"fill",
	"fill-opacity",
	"chargingPower",
	"occupancyTrendString",
] as const;

export type LearnableFeatureMissHandler = (
	key: string,
	feature: LearnableFeature,
) => void;

export type LearnableFeatureOptions = {
	backing?: Record<string, unknown> | null;
	coreKeys?: Iterable<string>;
	onMiss?: LearnableFeatureMissHandler;
	promoteOnMiss?: boolean;
};

const warnedMissKeys = new Set<string>();

export function resetLearnableFeatureMissWarningsForTests(): void {
	warnedMissKeys.clear();
}

function defaultOnMiss(key: string): void {
	if (warnedMissKeys.has(key)) {
		return;
	}

	warnedMissKeys.add(key);
	console.warn(
		`[LearnableFeature] property "${key}" is not in the core OpenLayers bag; served from the backing store. Add it to coreKeys if styling or map code needs it.`,
	);
}

function isGeometry(value: unknown): value is Geometry {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as Geometry).getSimplifiedGeometry === "function"
	);
}

/**
 * OpenLayers Feature that keeps a small local property bag (core / promoted
 * keys) and serves everything else from a backing object — typically the
 * Redux / GeoJSON `properties` object, by reference.
 *
 * `getProperties()` stays local so the style hot path does not copy fat
 * UI-only keys (`description`, `tagGroups`, …). `get(key)` is the failsafe:
 * it warns (once per key) and can promote that key into the local bag.
 */
export default class LearnableFeature extends Feature {
	readonly coreKeys: Set<string>;
	private backing: Record<string, unknown> | null;
	private readonly onMiss: LearnableFeatureMissHandler;
	private readonly promoteOnMiss: boolean;

	constructor(
		geometryOrProperties?: Geometry | ObjectWithGeometry,
		options: LearnableFeatureOptions = {},
	) {
		super();

		this.coreKeys = new Set(options.coreKeys ?? DEFAULT_CORE_PROPERTY_KEYS);
		this.backing = options.backing ?? null;
		this.onMiss = options.onMiss ?? defaultOnMiss;
		this.promoteOnMiss = options.promoteOnMiss ?? false;

		if (!geometryOrProperties) {
			this.applyCoreFromBacking(true);
			return;
		}

		if (isGeometry(geometryOrProperties)) {
			this.setGeometry(geometryOrProperties);
			this.applyCoreFromBacking(true);
			return;
		}

		this.setProperties(geometryOrProperties, true);
	}

	setBacking(backing: Record<string, unknown> | null): void {
		this.backing = backing;
		this.applyCoreFromBacking(true);
	}

	getBacking(): Record<string, unknown> | null {
		return this.backing;
	}

	override get(key: string): unknown {
		const local: unknown = super.get(key);
		if (local !== undefined || key === this.getGeometryName()) {
			return local;
		}

		if (!this.backing || !Object.hasOwn(this.backing, key)) {
			return local;
		}

		const value = this.backing[key];
		if (this.coreKeys.has(key)) {
			return value;
		}

		this.onMiss(key, this);

		if (this.promoteOnMiss) {
			this.coreKeys.add(key);
			super.set(key, value, true);
		}

		return value;
	}

	override setProperties(
		values: Record<string, unknown>,
		silent?: boolean,
	): void {
		const geometryName = this.getGeometryName();
		if (Object.hasOwn(values, geometryName)) {
			super.set(geometryName, values[geometryName], silent);
			const properties = {...values};
			delete properties[geometryName];
			this.backing = properties;
		} else {
			this.backing = values;
		}

		this.applyCoreFromBacking(silent);
	}

	override clone(): LearnableFeature {
		const clone = new LearnableFeature(undefined, {
			backing: this.backing,
			coreKeys: this.coreKeys,
			onMiss: this.onMiss,
			promoteOnMiss: this.promoteOnMiss,
		});
		clone.setGeometryName(this.getGeometryName());

		const local = this.getPropertiesInternal();
		if (local) {
			const geometry = this.getGeometry();
			for (const key of Object.keys(local)) {
				if (key === this.getGeometryName() && geometry) {
					clone.set(key, geometry.clone());
				} else {
					clone.set(key, local[key], true);
				}
			}
		}

		const style = this.getStyle();
		if (style) {
			clone.setStyle(style);
		}

		return clone;
	}

	private applyCoreFromBacking(silent?: boolean): void {
		if (!this.backing) {
			return;
		}

		const geometryName = this.getGeometryName();
		for (const key of this.coreKeys) {
			if (key === geometryName || !Object.hasOwn(this.backing, key)) {
				continue;
			}

			super.set(key, this.backing[key], silent);
		}
	}
}
