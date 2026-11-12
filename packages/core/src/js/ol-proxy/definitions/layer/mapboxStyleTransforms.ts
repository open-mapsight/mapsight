/**
 * Browser-side counterpart of the tile-proxy `setLayerProperties` style
 * transform. It rewrites layers of a Mapbox / MapLibre style document without
 * touching its sources, so the same transform list works in the proxy and in
 * the browser.
 */

/**
 * Layer selector. Fields combine with AND, values within a field with OR. An
 * omitted or empty selector matches all layers. A field with an empty list
 * matches no layer.
 */
export type MapboxStyleLayerSelector = {
	/** Exact layer ids. */
	ids?: string[];
	/** Layer id prefixes. */
	prefixes?: string[];
	/** Exact `source-layer` names. */
	sourceLayers?: string[];
	/** Layer types, e.g. `fill`, `line`, `symbol`. */
	types?: string[];
};

/**
 * Layer properties to change. `paint` and `layout` entries are merged by
 * property name (`null` removes an entry); the other properties are replaced
 * (`null` removes them). Expressions are copied verbatim.
 */
export type MapboxStyleLayerProperties = {
	paint?: Record<string, unknown>;
	layout?: Record<string, unknown>;
	filter?: unknown;
	minzoom?: number | null;
	maxzoom?: number | null;
};

export type SetLayerPropertiesTransform = {
	op: "setLayerProperties";
	selector?: MapboxStyleLayerSelector;
	properties?: MapboxStyleLayerProperties;
};

/** Supported style transforms. Only `setLayerProperties` exists. */
export type MapboxStyleTransform = SetLayerPropertiesTransform;

/** Minimal shape of a style document; everything else is passed through. */
export type MapboxStyleDocument = {
	layers?: unknown[];
	[key: string]: unknown;
};

const SELECTOR_FIELDS = ["ids", "prefixes", "sourceLayers", "types"] as const;
const PROPERTY_FIELDS = [
	"paint",
	"layout",
	"filter",
	"minzoom",
	"maxzoom",
] as const;

type SelectorField = (typeof SELECTOR_FIELDS)[number];
type PropertyField = (typeof PROPERTY_FIELDS)[number];

type ValidSetLayerProperties = {
	selector: Array<[SelectorField, string[]]>;
	properties: Array<[PropertyField, unknown]>;
};

type Layer = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
	return Array.isArray(value)
		? "array"
		: value === null
			? "null"
			: typeof value;
}

function validateSetLayerProperties(
	transform: Record<string, unknown>,
	fail: (message: string) => never,
): ValidSetLayerProperties {
	for (const key of Object.keys(transform)) {
		if (key !== "op" && key !== "selector" && key !== "properties") {
			fail(`unknown field "${key}"`);
		}
	}

	const selectorInput = transform.selector ?? {};
	if (!isPlainObject(selectorInput)) {
		return fail(
			`"selector" must be an object, got ${describe(selectorInput)}`,
		);
	}
	const selector: ValidSetLayerProperties["selector"] = [];
	for (const [field, values] of Object.entries(selectorInput)) {
		if (!(SELECTOR_FIELDS as readonly string[]).includes(field)) {
			return fail(
				`unknown selector field "${field}" (supported: ${SELECTOR_FIELDS.join(", ")})`,
			);
		}
		if (
			!Array.isArray(values) ||
			!values.every((value) => typeof value === "string")
		) {
			return fail(
				`selector field "${field}" must be an array of strings`,
			);
		}
		selector.push([field as SelectorField, values]);
	}

	const propertiesInput = transform.properties ?? {};
	if (!isPlainObject(propertiesInput)) {
		return fail(
			`"properties" must be an object, got ${describe(propertiesInput)}`,
		);
	}
	const properties: ValidSetLayerProperties["properties"] = [];
	for (const [field, value] of Object.entries(propertiesInput)) {
		if (!(PROPERTY_FIELDS as readonly string[]).includes(field)) {
			return fail(
				`unknown property "${field}" (supported: ${PROPERTY_FIELDS.join(", ")})`,
			);
		}
		if (field === "paint" || field === "layout") {
			if (!isPlainObject(value)) {
				return fail(
					`property "${field}" must be an object, got ${describe(value)}`,
				);
			}
			if (Object.hasOwn(value, "__proto__")) {
				return fail(`property "${field}" contains an invalid name`);
			}
		} else if (field === "minzoom" || field === "maxzoom") {
			if (
				value !== null &&
				(typeof value !== "number" || !Number.isFinite(value))
			) {
				return fail(
					`property "${field}" must be a number or null, got ${describe(value)}`,
				);
			}
		} else if (
			value !== null &&
			!Array.isArray(value) &&
			typeof value !== "boolean"
		) {
			return fail(
				`property "filter" must be an expression array, a boolean or null, got ${describe(value)}`,
			);
		}
		properties.push([field as PropertyField, value]);
	}

	return {selector, properties};
}

function matchesSelector(
	layer: Layer,
	selector: ValidSetLayerProperties["selector"],
): boolean {
	return selector.every(([field, values]) => {
		switch (field) {
			case "ids":
				return values.includes(layer.id as string);
			case "types":
				return values.includes(layer.type as string);
			case "sourceLayers":
				return values.includes(layer["source-layer"] as string);
			case "prefixes": {
				const id = typeof layer.id === "string" ? layer.id : "";
				return values.some((prefix) => id.startsWith(prefix));
			}
		}
	});
}

function applyProperties(
	layer: Layer,
	properties: ValidSetLayerProperties["properties"],
): void {
	for (const [field, value] of properties) {
		if (field === "paint" || field === "layout") {
			const target: Record<string, unknown> = isPlainObject(layer[field])
				? layer[field]
				: {};
			for (const [name, entry] of Object.entries(
				value as Record<string, unknown>,
			)) {
				if (entry === null) {
					delete target[name];
				} else {
					target[name] = structuredClone(entry);
				}
			}
			// An empty paint/layout object is dropped, as the proxy does.
			if (Object.keys(target).length === 0) {
				delete layer[field];
			} else {
				layer[field] = target;
			}
		} else if (value === null) {
			delete layer[field];
		} else {
			layer[field] = structuredClone(value);
		}
	}
}

/**
 * Applies `setLayerProperties` transforms to a style document and returns the
 * result as a new document; `style` and `transforms` are not modified.
 * Transforms run in order. Sources are never changed.
 *
 * All transforms are validated before the style is touched. An invalid
 * transform (non-object, unsupported `op`, unknown selector field or
 * property, wrong value types) throws an error naming its index.
 */
export function applyMapboxStyleTransforms<T extends MapboxStyleDocument>(
	style: T,
	transforms: readonly MapboxStyleTransform[],
): T {
	if (!Array.isArray(transforms)) {
		throw new Error(
			`Invalid style transforms: expected an array, got ${describe(transforms)}`,
		);
	}

	const validated = transforms.map((transform: unknown, index) => {
		const fail = (message: string): never => {
			throw new Error(
				`Invalid style transform at index ${index}: ${message}`,
			);
		};
		if (!isPlainObject(transform)) {
			return fail(`expected an object, got ${describe(transform)}`);
		}
		if (transform.op !== "setLayerProperties") {
			return fail(
				`unsupported op ${JSON.stringify(transform.op)} (only "setLayerProperties" is supported)`,
			);
		}
		return validateSetLayerProperties(transform, fail);
	});

	const result = structuredClone(style);
	if (!Array.isArray(result.layers)) {
		return result;
	}

	for (const {selector, properties} of validated) {
		for (const layer of result.layers) {
			if (isPlainObject(layer) && matchesSelector(layer, selector)) {
				applyProperties(layer, properties);
			}
		}
	}

	return result;
}
