import type {ElementType, HTMLAttributes, ReactNode, Ref} from "react";
import {
	createContext,
	createElement,
	useContext,
	useEffect,
	useMemo,
} from "react";

import {isDevelopment} from "@mapsight/core/lib/helpers/isDevelopment";

export type HeadingRank = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingElement = `h${HeadingRank}` | "div" | "p";
export type HeadingSlot =
	| "appTitle"
	| "switcher"
	| "switcherGroup"
	| "searchGroup"
	| "featureListGroup"
	| "featureDetailsTitle"
	| "timeFilter"
	| "toolTitle"
	| "sheetTitle"
	| "dialogTitle"
	| "listOptionsTitle"
	| "listOptionsSection";

export type HeadingOptions = {
	/** First Mapsight heading rank, not the surrounding heading's rank. Default 2. */
	baseLevel?: HeadingRank;
	/** Explicit elements for exceptional compositions. Requires v8_automaticHeadings. */
	overrides?: Partial<Record<HeadingSlot, HeadingElement>>;
};

type HeadingContextValue = {
	enabled: boolean;
	level: HeadingRank;
	overrides: NonNullable<HeadingOptions["overrides"]>;
};

const EMPTY_OVERRIDES = {};
const HeadingsContext = createContext<HeadingContextValue>({
	enabled: false,
	level: 2,
	overrides: EMPTY_OVERRIDES,
});
HeadingsContext.displayName = "HeadingsContext";

function assertHeadingRank(level: number): asserts level is HeadingRank {
	if (!Number.isInteger(level) || level < 1 || level > 6) {
		throw new RangeError(
			"Mapsight heading levels must be integers from 1 to 6.",
		);
	}
}

/** Instance boundary. Custom renderers normally receive this through AppContext. */
export function HeadingsProvider({
	enabled = false,
	options,
	children,
}: {
	enabled?: boolean;
	options?: HeadingOptions;
	children?: ReactNode;
}) {
	const value = useMemo((): HeadingContextValue => {
		const level = enabled ? (options?.baseLevel ?? 2) : 2;
		assertHeadingRank(level);
		const overrides = enabled
			? (options?.overrides ?? EMPTY_OVERRIDES)
			: EMPTY_OVERRIDES;
		for (const element of Object.values(overrides)) {
			if (
				element !== undefined &&
				(typeof element !== "string" ||
					!/^(h[1-6]|div|p)$/.test(element))
			) {
				throw new TypeError(
					"Mapsight heading overrides must be h1–h6, div, or p.",
				);
			}
		}
		return {enabled, level, overrides};
	}, [enabled, options]);
	return (
		<HeadingsContext.Provider value={value}>
			{children}
		</HeadingsContext.Provider>
	);
}

export function useAutomaticHeadings(): boolean {
	return useContext(HeadingsContext).enabled;
}

/** The first heading rank in this scope; custom headings can supply a legacy fallback. */
export function useHeadingLevel(fallback: HeadingRank = 2): HeadingRank {
	const context = useContext(HeadingsContext);
	return context.enabled ? context.level : fallback;
}

/** Sets an absolute rank for a composed subtree. Does not enable the future flag. */
export function HeadingLevel({
	level,
	children,
}: {
	level: HeadingRank;
	children?: ReactNode;
}) {
	assertHeadingRank(level);
	const context = useContext(HeadingsContext);
	const value = useMemo(() => ({...context, level}), [context, level]);
	return (
		<HeadingsContext.Provider value={value}>
			{children}
		</HeadingsContext.Provider>
	);
}

function headingRank(element?: ElementType): HeadingRank | undefined {
	return typeof element === "string" && /^h[1-6]$/.test(element)
		? (Number(element.slice(1)) as HeadingRank)
		: undefined;
}

function childRank(level: HeadingRank): HeadingRank {
	return Math.min(6, level + 1) as HeadingRank;
}

/** Resolve explicit props before slot overrides, contextual ranks, and legacy elements. */
export function useHeadingElement(
	slot: HeadingSlot | undefined,
	fallbackAs: ElementType,
	as?: ElementType,
	options?: {parentAs?: ElementType; level?: HeadingRank},
): ElementType {
	const context = useContext(HeadingsContext);
	if (as !== undefined) return as;
	if (!context.enabled) return fallbackAs;
	const override = slot === undefined ? undefined : context.overrides[slot];
	if (override !== undefined) return override;
	const parent = headingRank(options?.parentAs);
	const level =
		options?.level ??
		(parent === undefined ? context.level : childRank(parent));
	return `h${level}`;
}

/** Advances only below an actual native heading. Labels and opaque components do not advance. */
export function HeadingContent({
	headingAs,
	children,
}: {
	headingAs?: ElementType;
	children?: ReactNode;
}) {
	const context = useContext(HeadingsContext);
	const rank = headingRank(headingAs);
	useEffect(() => {
		if (context.enabled && rank === 6 && isDevelopment()) {
			console.warn(
				"Mapsight heading depth exceeds h6; child headings stay at h6. Flatten this section structure.",
			);
		}
	}, [context.enabled, rank]);
	if (!context.enabled || rank === undefined) return children;
	return <HeadingLevel level={childRank(rank)}>{children}</HeadingLevel>;
}

export type HeadingProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	headingSlot?: HeadingSlot;
	/** Element used without the flag. Default h2. */
	fallbackAs?: ElementType;
	ref?: Ref<HTMLElement>;
};

/** Native contextual heading for host components and replacements. */
export function Heading({
	as,
	headingSlot,
	fallbackAs = "h2",
	...props
}: HeadingProps) {
	const element = useHeadingElement(headingSlot, fallbackAs, as);
	return createElement(element, props);
}
