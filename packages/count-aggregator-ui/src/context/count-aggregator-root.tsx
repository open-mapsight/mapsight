import {
	type CSSProperties,
	type ReactElement,
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

import {type CountAggregatorTheme, createTheme} from "../lib/theme.js";
import {cn} from "../lib/utils.js";

interface CountAggregatorRootContextValue {
	portalElement: HTMLElement | null;
	rootElement: HTMLElement | null;
}

const CountAggregatorRootContext =
	createContext<CountAggregatorRootContextValue | null>(null);

export function useCountAggregatorPortal(): HTMLElement | undefined {
	const context = useContext(CountAggregatorRootContext);

	return context?.portalElement ?? undefined;
}

export function useCountAggregatorRootElement(): HTMLElement | undefined {
	const context = useContext(CountAggregatorRootContext);

	return context?.rootElement ?? undefined;
}

export function CountAggregatorRoot({
	theme,
	className,
	style,
	children,
}: {
	theme?: CountAggregatorTheme;
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
}): ReactElement {
	const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
	const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(
		null,
	);

	const rootRef = useCallback((node: HTMLDivElement | null) => {
		setRootElement(node);
	}, []);

	const portalRef = useCallback((node: HTMLDivElement | null) => {
		setPortalElement(node);
	}, []);

	const themeStyle = useMemo(
		() => (theme === undefined ? undefined : createTheme(theme)),
		[theme],
	);

	const contextValue = useMemo(
		(): CountAggregatorRootContextValue => ({
			portalElement,
			rootElement,
		}),
		[portalElement, rootElement],
	);

	return (
		<CountAggregatorRootContext.Provider value={contextValue}>
			<div
				ref={rootRef}
				className={cn(
					"msp-count-aggregator msca:min-w-0 msca:max-w-full",
					className,
				)}
				style={{...themeStyle, ...style}}
			>
				{children}
				<div
					ref={portalRef}
					id="msp-count-aggregator-portal"
					aria-hidden="true"
				/>
			</div>
		</CountAggregatorRootContext.Provider>
	);
}
