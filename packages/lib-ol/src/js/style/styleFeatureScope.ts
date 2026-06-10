import type {FeatureLike} from "ol/Feature";

export type StyleFeatureScopeHooks = {
	enter: (feature: {changed: () => void}) => void;
	exit: () => void;
};

const hooks: Array<StyleFeatureScopeHooks> = [];

export function addStyleFeatureScopeHooks(
	newHook: StyleFeatureScopeHooks | null,
): void {
	if (newHook) {
		hooks.push(newHook);
	}
}

export function enterStyleFeatureScope(feature: FeatureLike) {
	if ("changed" in feature && typeof feature.changed === "function") {
		hooks.forEach((hook) => hook.enter(feature));
		return () => {
			hooks.forEach((hook) => hook.exit());
		};
	}

	return () => {};
}
