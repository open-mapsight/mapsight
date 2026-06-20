import type Geometry from "ol/geom/Geometry";
import type {Type as GeometryType} from "ol/geom/Geometry";
import type GeometryCollection from "ol/geom/GeometryCollection";
import LRUCache from "ol/structs/LRUCache";
import type Style from "ol/style/Style";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

import type {Derivation} from "../geometry/deriveGeometriesFromBase.ts";
import deriveGeometriesFromBase from "../geometry/deriveGeometriesFromBase.ts";
import type {GroupedRootStyleDeclaration} from "../index.ts";
import declarationToGeometry from "./declarationToGeometry.ts";
import declarationToStyle from "./declarationToStyle.ts";
import {enterStyleFeatureScope} from "./styleFeatureScope.ts";
import type {
	MapsightStyleFunction,
	MapsightStyleFunctionEnv,
	MapsightStyleFunctionProps,
} from "./styleFunction.ts";
import {STYLE_ENV_FIELD_NAME, createPropsFilter} from "./styleFunction.ts";

const TYPE_GEOMETRY_COLLECTION: GeometryType = "GeometryCollection";
const DEFAULT_STYLE = "default";
const HASH_STRING_DELIMITER = "|";

const DEFAULT_ROOT_STYLE_TYPE = "style";

const DEFAULT_CACHE_LEVEL_1_SIZE = 100;
const DEFAULT_CACHE_LEVEL_2_SIZE = 100;
const DEFAULT_CACHE_LEVEL_3_SIZE = 100;

type CachedValue = {
	style: Style | null;
	geometryTypeOrDerivation: GeometryType | Derivation | null;
};
type CachedValues = Array<CachedValue>;

export type StyleFunctionMetrics = {
	envHashMs: number;
	propsHashMs: number;
	level1Hits: number;
	level1Misses: number;
	level2Hits: number;
	level2Misses: number;
	declarationMs: number;
	styleMaterializationMs: number;
	inputStylesCount: number;
	outputStylesCount: number;
	geometryCollectionsTraversed: number;
	totalMs: number;
};

export type StyleFunctionMetricsCollector = (
	metrics: StyleFunctionMetrics,
) => void;

export type StyleFunctionOptions = {
	constructorsMap: Record<string, unknown>;
	metricsCollector?: StyleFunctionMetricsCollector;
	declarationHashFunction: (
		env: MapsightStyleFunctionEnv,
		props: MapsightStyleFunctionProps,
		envHash: string,
		geometryType: GeometryType,
		styleName: string,
	) => string;
	declarationFunction: (
		env: MapsightStyleFunctionEnv,
		props: MapsightStyleFunctionProps,
		geometryType: GeometryType,
		styleName: string,
	) => unknown; // Using GroupedRootStyleDeclaration here breaks tsc, probably because the object is too big/complex
	volatileHashFunction?: (
		env: MapsightStyleFunctionEnv,
		props: MapsightStyleFunctionProps,
		geometryType: GeometryType,
		styleName: string,
	) => string;
	allowedProps?: Array<string> | false;
	allowedStyles?: Array<string> | false;
	cacheLevel1Size?: number;
	cacheLevel2Size?: number;
	cacheLevel3Size?: number;
};

/**
 * Creates a cached mapsight style function for openlayers
 *
 * @param constructorsMap map of style constructors
 * @param [metricsCollector] optional callback receiving per-invocation runtime metrics (hash timing, cache hit/miss, and declaration/style timings)
 * @param declarationHashFunction style declaration hash function
 * @param declarationFunction style declaration function
 * @param [volatileHashFunction] optional volatile hash function for values that should trigger a cache miss when changed, even if the declaration hash is the same (e.g. for time-based styling)
 * @param [allowedProps=false] list of props allowed, false = all allowed
 * @param [allowedStyles=false] list of styles allowed, false = all allowed
 * @param [cacheLevel1Size=100] size of first level cache that caches feature geometry styles based on feature and environment state
 * @param [cacheLevel2Size=100] size of second level cache that caches style objects based on the rules that apply and the environment state
 * @param [cacheLevel3Size=100] size of third level cache that caches style objects based on the rules that apply and the environment state
 *
 * @returns style function
 */
export default function createCachedStyleFunction({
	constructorsMap,
	metricsCollector,
	declarationHashFunction,
	declarationFunction,
	volatileHashFunction,
	allowedProps = false,
	allowedStyles = false,
	cacheLevel1Size = DEFAULT_CACHE_LEVEL_1_SIZE,
	cacheLevel2Size = DEFAULT_CACHE_LEVEL_2_SIZE,
	cacheLevel3Size = DEFAULT_CACHE_LEVEL_3_SIZE,
}: StyleFunctionOptions) {
	const hasMetricsCollector = typeof metricsCollector === "function";
	const filterProps = createPropsFilter(allowedProps);
	const createHash = (value: unknown) => JSON.stringify(value);

	const cacheLevel1 = new LRUCache<CachedValues>(cacheLevel1Size); // the first level cache caches feature geometry styles based on feature and environment state
	const cacheLevel2 = new LRUCache<CachedValues>(cacheLevel2Size); // the second level cache caches style objects based on the rules that apply and the environment state
	const cacheLevel3 = new LRUCache<Style | null>(cacheLevel3Size); // the third level cache caches style objects based on the rules that apply and the environment state

	function resolveStyleName(env: MapsightStyleFunctionEnv): string {
		let styleName: string = DEFAULT_STYLE;

		const envStyle = env[STYLE_ENV_FIELD_NAME];
		if (typeof envStyle === "string") {
			if (allowedStyles === false) {
				styleName = envStyle;
			} else {
				styleName =
					allowedStyles.indexOf(envStyle) > -1
						? envStyle
						: DEFAULT_STYLE;
			}
		}

		return styleName;
	}

	function level1(
		env: MapsightStyleFunctionEnv,
		props: MapsightStyleFunctionProps,
		envHash: string,
		propsHash: string,
		geometryType: GeometryType,
		metrics?: StyleFunctionMetrics,
	): CachedValues {
		const volatileHash = volatileHashFunction
			? volatileHashFunction(
					env,
					props,
					geometryType,
					resolveStyleName(env),
				)
			: "";
		const cacheHashL1 =
			envHash +
			HASH_STRING_DELIMITER +
			volatileHash +
			HASH_STRING_DELIMITER +
			geometryType +
			HASH_STRING_DELIMITER +
			propsHash;
		const hasLevel1 = cacheLevel1.containsKey(cacheHashL1);
		if (metrics) {
			if (hasLevel1) {
				metrics.level1Hits += 1;
			} else {
				metrics.level1Misses += 1;
			}
		}

		if (!hasLevel1) {
			cacheLevel1.set(
				cacheHashL1,
				level2(
					env,
					props,
					envHash,
					propsHash,
					geometryType,
					volatileHash,
					metrics,
				),
			);
		}

		return cacheLevel1.get(cacheHashL1);
	}

	function level2(
		env: MapsightStyleFunctionEnv,
		props: MapsightStyleFunctionProps,
		envHash: string,
		propsHash: string,
		geometryType: GeometryType,
		volatileHash: string,
		metrics?: StyleFunctionMetrics,
	): CachedValues {
		const styleName = resolveStyleName(env);

		const cacheHashL2 =
			declarationHashFunction(
				env,
				props,
				envHash,
				geometryType,
				styleName,
			) +
			HASH_STRING_DELIMITER +
			volatileHash;
		if (cacheLevel2.containsKey(cacheHashL2)) {
			if (metrics) {
				metrics.level2Hits += 1;
			}
			return cacheLevel2.get(cacheHashL2);
		}
		if (metrics) {
			metrics.level2Misses += 1;
		}

		const declarationStart = metrics ? performance.now() : 0;
		const declarations = declarationFunction(
			env,
			props,
			geometryType,
			styleName,
		) as GroupedRootStyleDeclaration; // Having to cast here because of the tsc bug noted above
		if (metrics) {
			metrics.declarationMs += performance.now() - declarationStart;
		}

		const styleMaterializationStart = metrics ? performance.now() : 0;
		const values: CachedValues = Object.keys(declarations).map((group) => ({
			style: declarationToStyle(
				constructorsMap,
				ensureNonNullable(declarations[group]),
				DEFAULT_ROOT_STYLE_TYPE,
				group + "," + cacheHashL2,
				cacheLevel3,
			),
			geometryTypeOrDerivation: declarationToGeometry(
				declarations[group],
			),
		}));
		if (metrics) {
			metrics.styleMaterializationMs +=
				performance.now() - styleMaterializationStart;
			metrics.inputStylesCount += values.length;
		}
		cacheLevel2.set(cacheHashL2, values);

		return values;
	}

	function styleGeometryOrGeometryCollectionCached(
		env: MapsightStyleFunctionEnv,
		props: MapsightStyleFunctionProps,
		envHash: string,
		propsHash: string,
		geometryOrGeometryCollection?: Geometry,
		metrics?: StyleFunctionMetrics,
		i = 0,
	): Array<Style> {
		if (!geometryOrGeometryCollection) {
			return [];
		}

		const geometryType = geometryOrGeometryCollection.getType();

		// recurse through collections
		if (geometryType === TYPE_GEOMETRY_COLLECTION) {
			if (metrics) {
				metrics.geometryCollectionsTraversed += 1;
			}
			const collection =
				geometryOrGeometryCollection as GeometryCollection;
			const typeIndexes = new Map<GeometryType, number>();

			return collection
				.getGeometries()
				.flatMap((geometry: Geometry, geometryCollectionIndex) => {
					const childGeometryType = geometry.getType();
					const geometryCollectionTypeIndex =
						typeIndexes.get(childGeometryType) ?? 0;
					typeIndexes.set(
						childGeometryType,
						geometryCollectionTypeIndex + 1,
					);
					const childEnv = {
						...env,
						geometryCollectionIndex,
						geometryCollectionTypeIndex,
					};
					const childEnvHashStart = metrics ? performance.now() : 0;
					const childEnvHash = createHash(childEnv);
					if (metrics) {
						metrics.envHashMs +=
							performance.now() - childEnvHashStart;
					}

					return styleGeometryOrGeometryCollectionCached(
						childEnv,
						props,
						childEnvHash,
						propsHash,
						geometry,
						metrics,
						i + 1,
					);
				});
		}

		return level1(env, props, envHash, propsHash, geometryType, metrics)
			.filter(({style}) => style != null)
			.flatMap(function bindStyleToBaseGeometry({
				style: baseStyle,
				geometryTypeOrDerivation: geometryDerivation,
			}: CachedValue) {
				if (baseStyle === null) {
					return [];
				}

				const derivedGeometries = deriveGeometriesFromBase(
					geometryOrGeometryCollection,
					geometryDerivation,
				);

				return derivedGeometries.map(
					function bindDerivedGeometryToStyle(geometryWithMeta) {
						const [geometry, meta] = geometryWithMeta;
						const style = baseStyle.clone();
						style.setGeometry(geometry);

						const baseImageStyle = style.getImage();
						if (meta?.rotation != null && baseImageStyle) {
							const imageStyle = baseImageStyle.clone();
							const baseRotation = imageStyle.getRotation();
							imageStyle.setRotation(
								baseRotation + meta.rotation,
							);
							style.setImage(imageStyle);
						}
						return style;
					},
				);
			});
	}

	const cachedStyleFunction: MapsightStyleFunction = (env = {}, feature) => {
		const totalStart = hasMetricsCollector ? performance.now() : 0;
		const metrics: StyleFunctionMetrics | undefined = hasMetricsCollector
			? {
					envHashMs: 0,
					propsHashMs: 0,
					level1Hits: 0,
					level1Misses: 0,
					level2Hits: 0,
					level2Misses: 0,
					declarationMs: 0,
					styleMaterializationMs: 0,
					inputStylesCount: 0,
					outputStylesCount: 0,
					geometryCollectionsTraversed: 0,
					totalMs: 0,
				}
			: undefined;

		const exit = enterStyleFeatureScope(feature);

		// subset of feature properties that are relevant for styling (also used for caching decisions)
		const filteredProps = filterProps(feature.getProperties());
		const envHashStart = hasMetricsCollector ? performance.now() : 0;
		const envHash = createHash(env);
		if (metrics) {
			metrics.envHashMs = performance.now() - envHashStart;
		}
		const propsHashStart = hasMetricsCollector ? performance.now() : 0;
		const propsHash = createHash(filteredProps);
		if (metrics) {
			metrics.propsHashMs = performance.now() - propsHashStart;
		}

		const styles = styleGeometryOrGeometryCollectionCached(
			env,
			filteredProps,
			envHash,
			propsHash,
			feature.getGeometry() as Geometry,
			metrics,
		);

		exit();

		if (metrics && metricsCollector) {
			metrics.outputStylesCount = styles.length;
			metrics.totalMs = performance.now() - totalStart;
			metricsCollector(metrics);
		}

		return styles;
	};

	return cachedStyleFunction;
}
