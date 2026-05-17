import type {Definition, OlConstructor} from ".";

export type Definitions<T extends OlConstructor = OlConstructor> = Record<
	string,
	Definition<T>
>;

/** Stores definitions */
export default class DependencyManager {
	private readonly _dependencies: Definitions = {};

	constructor(dependencies: Definitions = {}) {
		this._dependencies = dependencies;
	}

	static makeInstance<C extends OlConstructor>(
		definition: Definition<C>,
		...args: ConstructorParameters<C>
	): null | InstanceType<C> {
		try {
			definition.events?.beforeCreation?.(...args);
			const instance = new definition.Constructor(...args);
			definition.events?.afterCreation?.(instance, ...args);
			return instance;
		} catch (exception) {
			DependencyManager._handleError(
				definition,
				`Failed to construct object "${definition.type}".`,
				exception,
				{
					Constructor: definition.Constructor,
					args,
				},
			);
			return null;
		}
	}

	static _handleError<T extends OlConstructor = OlConstructor>(
		definition: Definition<T>,
		...errorMessages: Array<unknown>
	): void {
		console.error(...errorMessages);
		const creationFailed = definition.events?.creationFailed?.bind(
			definition.events,
		);
		if (creationFailed) {
			creationFailed(...errorMessages);
		}
	}

	static checkObjectType<C extends OlConstructor>(
		definition: null | undefined | Definition<C>,
		obj: unknown,
	): obj is InstanceType<C> {
		return !!(obj && definition && obj instanceof definition.Constructor);
	}

	injectDefinitions(definitions: Array<Definition>): void {
		for (const def of definitions) {
			this._dependencies[def.type] = def;
		}
	}

	getDefinition<T extends OlConstructor = OlConstructor>(
		type: string,
	): undefined | Definition<T> {
		return this._dependencies[type];
	}

	makeInstance<T extends OlConstructor = OlConstructor>(
		type: string,
		...args: ConstructorParameters<T>
	) {
		const def: Definition<T> | undefined = this.getDefinition(type);
		if (!def) {
			return null;
		}

		return DependencyManager.makeInstance(def, ...args);
	}

	checkObjectType(type: null | undefined | string, obj: unknown): boolean {
		if (typeof type !== "string") {
			return false;
		}

		return DependencyManager.checkObjectType(this.getDefinition(type), obj);
	}
}
