import type {ComponentType, ReactNode} from "react";
import {createContext, createElement, useCallback, useContext} from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComponentProps {
	// extendable
}

export type PropsWithFallback<P = unknown> = P & {
	fallback?: ReactNode | undefined;
};

/** @deprecated */
export type ComponentPropsWithFallback = {
	MapOverlayModal: PropsWithFallback;
	MapOverlayStart: PropsWithFallback;
	MapOverlayEnd: PropsWithFallback;
	MapOverlayTopLeft: PropsWithFallback;
	MapOverlayTopRight: PropsWithFallback;
	MapOverlayBottomLeft: PropsWithFallback;
	MapOverlayBottomRight: PropsWithFallback;
};

export type MapsightUiComponents = {
	[N in keyof ComponentProps]?: ComponentType<ComponentProps[N]>;
} & {
	[N in keyof ComponentPropsWithFallback]?: ComponentType<
		ComponentPropsWithFallback[N]
	>;
};

export const ComponentsContext = createContext<MapsightUiComponents>({});
ComponentsContext.displayName = "ComponentsContext";

/** @deprecated */
export function useContextComponentWithFallback<
	N extends keyof ComponentPropsWithFallback,
>(
	componentName: N,
): (fallback?: ReactNode, props?: ComponentPropsWithFallback[N]) => ReactNode {
	const Comp = useContext(ComponentsContext)[componentName];
	return useCallback(
		(fallback, props) => {
			if (Comp) {
				return createElement(Comp, {...props, fallback});
			}
			return fallback;
		},
		[Comp],
	);
}

export function makeReplaceableComponent<N extends keyof ComponentProps>(
	componentName: N,
	Component: ComponentType<ComponentProps[N]>,
): ComponentType<ComponentProps[N]> {
	const NewComp: ComponentType<ComponentProps[N]> = (props) => {
		const CtxComp = useContext(ComponentsContext)[componentName];
		if (CtxComp !== undefined) {
			return createElement(CtxComp as any, props as any);
		}
		return createElement(Component as any, props as any);
	};
	NewComp.displayName = `MsUiReplaceable${componentName}`;
	return NewComp;
}
