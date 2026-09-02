import type {ErrorInfo, ReactNode} from "react";

export type ErrorBoundaryVariant = "page" | "region" | "overlay";

export type ErrorBoundaryFallbackProps = {
	error: Error;
	reset: () => void;
	variant: ErrorBoundaryVariant;
};

export type ErrorBoundaryProps = {
	children?: ReactNode;
	/**
	 * Replace the default fallback. A render function receives `reset` so the
	 * host can remount the failed subtree.
	 */
	fallback?: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode);
	onError?: (error: Error, info: ErrorInfo) => void;
	/** When these values change after a failure, the subtree remounts. */
	resetKeys?: ReadonlyArray<unknown>;
	/** Layout of the default fallback. Default `region`. */
	variant?: ErrorBoundaryVariant;
};

export type ErrorBoundaryState = {
	error: Error | null;
};
