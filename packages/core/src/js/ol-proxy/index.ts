import isEqual from "lodash/isEqual";

import {isDevelopment} from "@/lib/helpers/isDevelopment";
import type {
	Description,
	LayerState,
	OptionValue,
	Options,
} from "@/lib/map/types";
import {isDescription} from "@/lib/map/types";

import DependencyManager from "./DependencyManager";

function isMapsightDebugEnabled(): boolean {
	if (typeof process !== "undefined" && process.env.MAPSIGHT_DEBUG) {
		const flag = process.env.MAPSIGHT_DEBUG;
		return flag !== "0" && flag !== "false";
	}

	if (typeof import.meta !== "undefined") {
		const flag = (
			import.meta as ImportMeta & {env?: {MAPSIGHT_DEBUG?: string}}
		).env?.MAPSIGHT_DEBUG;
		return flag != null && flag !== "" && flag !== "0" && flag !== "false";
	}

	return false;
}

function olProxyDebug(...args: Parameters<typeof console.debug>) {
	if (isDevelopment() || isMapsightDebugEnabled()) {
		console.debug(...args);
	}
}

export {isDescription} from "@/lib/map/types";
export type {Description} from "@/lib/map/types";

/** Config ingress or runtime layer definition accepted by ol-proxy. */
export type LayerProxyDefinition = Description | LayerState;

// TODO: use symbols?
export const OPTION_SET = "__set__";
export const OPTION_COLLECTION = "__collection__";
export const INITIAL_OPTION_PASS = "__pass__";
export const OPTION_SKIP = "__skip__";

// TODO: Should we type this stricter?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OlConstructor = new (...args: any) => any;

export type OptionMapMapper<
	C extends OlConstructor = OlConstructor,
	TParent = unknown,
> = (
	target: InstanceType<C>,
	name: string,
	oldValue: unknown,
	newValue: unknown,
	misc: {
		oldOptions: undefined | Record<string, unknown>;
		newOptions: Record<string, unknown>;
		optionMap: OptionMap<C>;
		parentObject: TParent;
	},
) => void;

export type OptionMap<
	C extends OlConstructor = OlConstructor,
	TParent = unknown,
> = Record<
	string,
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	| typeof OPTION_SET
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	| typeof OPTION_SKIP
	| string
	| OptionMapMapper<C, TParent>
	| [typeof OPTION_COLLECTION, string]
>;

export type InitialOptionMapMapper<
	C extends OlConstructor,
	TParent = unknown,
> = (args: {
	name: string;
	value: unknown;
	parentObject: TParent;
	definition: Definition<C>;
}) => Record<string, unknown>;

/** Maps options to constructor arguments */
export type InitialOptionMap<C extends OlConstructor = OlConstructor> = Record<
	string,
	| true
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	| typeof INITIAL_OPTION_PASS
	| string
	| number
	| InitialOptionMapMapper<C>
>;

export type DefinitionEvents<C extends OlConstructor> = {
	beforeCreation?(...args: ConstructorParameters<C>): void;
	afterCreation?(
		instance: InstanceType<C>,
		...args: ConstructorParameters<C>
	): void;

	// TODO: useless?
	creationFailed?(...errorMessages: Array<unknown>): void;
};

export type Definition<
	C extends OlConstructor = OlConstructor,
	TParent = unknown,
> = {
	type: string;
	Constructor: new (...args: ConstructorParameters<C>) => InstanceType<C>;
	events?: DefinitionEvents<C>;
	optionMap: OptionMap<C, TParent>;
	initialOptionMap?: InitialOptionMap<C>;
	// TODO: This is probably wrong, it should match the `on` signature of ol.
	eventMap?: Array<string>;
};

export const di = new DependencyManager();

// Untested idea to simplify injection:
//export function load(group, name) {
//	di.inject({[group]: {[name]: require(`./definitions/${group}/${name}`)}});
//}

// or: add a type-to-definition-mapping somewhere (using dynamic imports):
// async function importDefinition(type: string): Promise<Definition> {
// 	switch (type) {
// 		case "VectorTileLayer":
// 			return (await import("./definitions/layer/vectortile")).default;
// 		default:
// 			throw new Error();
// 	}
// }

// then:
// di.injectDefinitions([await importDefinition("blaa"))]);

/**
 * Updates a proxy openlayers object
 *
 * @private
 */
export function setOptions<C extends OlConstructor>(
	object: InstanceType<C>,
	oldOptions: undefined | Options,
	newOptions: Options,
	optionMap: OptionMap<C>,
	parentObject: unknown = null,
) {
	const changedOptions = Object.entries(optionMap)
		.map(([name, updater]) => ({
			name,
			updater,
			newValue: newOptions[name],
			oldValue: oldOptions?.[name],
		}))
		.filter(
			({newValue, oldValue}) =>
				// TODO: support option entry removal. Or at least throw an error if there is
				// an entry missing from the current options, but was present in the previous
				// options. Now we are silently keeping the old value.
				newValue !== null &&
				newValue !== undefined &&
				newValue !== oldValue,
		);

	for (const {name, updater, newValue, oldValue} of changedOptions) {
		if (updater === OPTION_SET) {
			// Case: direct set
			if ("set" in object && typeof object.set === "function") {
				object.set(name, newValue);
			} else {
				console.error(
					`cannot set option using updater: ${updater} (OPTION_SET)`,
				);
			}
		} else if (updater === OPTION_SKIP) {
			// Case: skip
			// do nothing
		}
		// Case: setter
		else if (typeof updater === "string") {
			const key = updater as keyof typeof object;
			if (key in object && typeof object[key] === "function") {
				object[key](newValue);
			} else {
				console.error(
					`cannot set option using updater: ${updater} (${typeof updater})`,
				);
			}
		}
		// Case: callback
		else if (typeof updater === "function") {
			updater(object, name, oldValue, newValue, {
				oldOptions,
				newOptions,
				optionMap,
				parentObject,
			});
		}
		// Case: collection
		else if (Array.isArray(updater) && updater[0] === OPTION_COLLECTION) {
			const key = updater[1] as keyof typeof object;
			const collectionGetter = object[key];
			if (typeof collectionGetter !== "function") {
				console.error(
					`cannot set option using updater: ${JSON.stringify(updater)} (${typeof updater})`,
				);
				continue;
			}

			const collection = collectionGetter.call(object);

			// todo: improve by patching instead of replacing
			collection.clear();
			collection.extend(newValue);
		} else {
			console.error(
				`missing support for updater: ${JSON.stringify(updater)} (${typeof updater})`,
			);
		}
	}

	if (
		changedOptions.length > 0 &&
		"changed" in object &&
		typeof object.changed === "function"
	) {
		object.changed();
	}
}

/**
 * Maps initial options for a proxy openlayers object
 *
 * @private
 */
function processConstructorOptions(
	definition: Definition,
	options: Options,
	parentObject: unknown,
): Options {
	if (definition.initialOptionMap === undefined) {
		return {};
	}

	const values = Object.entries(definition.initialOptionMap)
		.map(([name, preparer]) => ({
			name,
			preparer,
			value: options[name],
		}))
		.filter(({value}) => value !== undefined && value !== null);

	const result: Options = {};

	for (const {name, preparer, value} of values) {
		// Case: true or pass
		if (preparer === true || preparer === INITIAL_OPTION_PASS) {
			result[name] = value;
		}
		// Case: string or number
		else if (typeof preparer === "string" || typeof preparer === "number") {
			result[preparer] = value;
		}
		// Case: callback
		else if (typeof preparer === "function") {
			Object.assign(
				result,
				preparer({value, name, parentObject, definition}),
			);
		} else {
			console.error(
				`missing support for preparer: ${JSON.stringify(preparer)} (${typeof preparer})`,
			);
		}
	}

	return result;
}

/**
 * @param diInstance dependency manager
 * @param targetName target option name
 *
 * @returns dependency mapper
 */
export function createDependencyMapper(
	diInstance: DependencyManager,
	targetName: string,
): InitialOptionMapMapper<OlConstructor> {
	return ({value, parentObject}) => {
		if (!isDescription(value)) {
			console.error(
				`dependency mapper could not get dependency: Invalid description.`,
			);
			return {};
		}

		const {type, options} = value;
		const def = diInstance.getDefinition(type);

		if (!def) {
			console.error(
				`dependency mapper could not get dependency: ${type}.`,
			);
			return {};
		}

		const constructorOptions =
			options !== undefined
				? processConstructorOptions(def, options, parentObject)
				: {};
		return {
			[targetName]: DependencyManager.makeInstance(
				def,
				constructorOptions,
			),
		};
	};
}

function createOrReplaceObject<
	C extends OlConstructor,
	TParent = unknown,
	TObject = InstanceType<C>,
>(
	definition: Definition<C>,
	oldObject: TObject | undefined,
	args: ConstructorParameters<C>,
	remover:
		null | ((oldObject: TObject, parentObject?: TParent) => void) = null,
	adder: null | ((object: TObject, parentObject?: TParent) => void) = null,
	parentObject?: TParent,
): null | TObject {
	if (oldObject && remover) {
		remover(oldObject, parentObject);
	}

	// create new object
	const object = DependencyManager.makeInstance(
		definition,
		...args,
	) as TObject | null;
	if (object && adder) {
		adder(object, parentObject);
	}

	return object;
}

function hasSomeOptionChanged(
	optionMap: OptionMap,
	newOptions: Options,
	oldOptions: Options,
) {
	return Object.keys(optionMap).some((key) => {
		const hasChanged = !isEqual(newOptions[key], oldOptions[key]);

		if (hasChanged) {
			olProxyDebug("ol-proxy: v UPDATE triggered by", key);
		}

		return hasChanged;
	});
}

function checkOptionsRequireNewCreation(
	definition: Definition,
	oldOptions: Options,
	newOptions: Options,
) {
	return (
		oldOptions !== newOptions &&
		definition.initialOptionMap !== undefined &&
		Object.keys(definition.initialOptionMap).some(
			(key) =>
				!Object.prototype.hasOwnProperty.call(
					definition.optionMap,
					key,
				) && !isEqual(newOptions[key], oldOptions[key]),
		)
	);
}

function getLeftDistinctValues<TValue = unknown>(
	leftObject: Record<string, TValue>,
	rightObject: Record<string, unknown>,
) {
	const leftValues: Record<string, TValue> = {};
	Object.entries(leftObject).forEach(([key, leftValue]) => {
		if (
			!Object.prototype.hasOwnProperty.call(rightObject, key) ||
			rightObject[key] === INITIAL_OPTION_PASS
		) {
			leftValues[key] = leftValue;
		}
	});

	return leftValues;
}

// TODO: add *object* type
export function updateProxyObject<
	TObject extends object = object,
	TParentObject = unknown,
>({
	di: diInstance,
	oldObject: object,
	oldDefinition: oldDescription,
	newDefinition: newDescription,
	remover,
	adder,
	parentObject,
}: {
	di: DependencyManager;
	// TODO: remove "old" prefix, there's only one object, no "old" nor "new"
	oldObject?: TObject;
	oldDefinition?: LayerProxyDefinition;
	newDefinition?: LayerProxyDefinition;
	remover?: (object: TObject, parentObject?: TParentObject) => void;
	adder?: (object: TObject, parentObject?: TParentObject) => void;
	parentObject?: TParentObject;
}) {
	if (!newDescription) {
		//console.debug('ol-proxy: Removed object ', {group, oldObject, oldDefinition, parentObject});
		if (object && remover) {
			remover(object, parentObject);
		}
		return;
	}

	const type = newDescription.type || (oldDescription && oldDescription.type);
	if (!type) {
		console.error(
			"ol-proxy: Cannot update proxy object. Definition is insufficient. Missing type.",
		);
		return;
	}

	const definition = diInstance.getDefinition(type);

	if (!definition) {
		console.error(
			`ol-proxy: Cannot update proxy object. Dependency unknown/not injected: ${type}.`,
		);
		return;
	}

	const oldOptions = oldDescription?.options;
	const newOptions = newDescription.options ?? {};

	let creationReason: "new" | "type" | "options" | null = null;
	if (!object) {
		creationReason = "new";
	} else if (!DependencyManager.checkObjectType(definition, object)) {
		creationReason = "type";
	} else if (
		oldOptions !== undefined &&
		checkOptionsRequireNewCreation(definition, oldOptions, newOptions)
	) {
		creationReason = "options";
	}

	if (creationReason !== null) {
		const obj = createOrReplaceObject(
			definition,
			object,
			[processConstructorOptions(definition, newOptions, parentObject)],
			remover,
			adder,
			parentObject,
		);
		olProxyDebug(
			"ol-proxy: CREATE",
			creationReason === "new"
				? "new"
				: creationReason === "options"
					? "changed options required constr."
					: "type changed",
			type,
		);

		if (obj && newOptions) {
			setOptions(
				obj,
				{},
				getLeftDistinctValues<OptionValue>(
					newOptions,
					definition.initialOptionMap ?? {},
				),
				definition.optionMap,
				parentObject,
			);
		}
	} else if (
		(oldOptions === undefined ||
			(newOptions &&
				hasSomeOptionChanged(
					definition.optionMap,
					newOptions,
					oldOptions,
				))) &&
		object
	) {
		olProxyDebug("ol-proxy: UPDATE", type);
		setOptions(
			object,
			oldOptions,
			newOptions,
			definition.optionMap,
			parentObject,
		);
	}
}
