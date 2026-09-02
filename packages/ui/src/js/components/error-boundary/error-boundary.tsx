import {Component, type ErrorInfo, type ReactNode} from "react";

import ErrorBoundaryFallback from "./fallback";
import type {
	ErrorBoundaryFallbackProps,
	ErrorBoundaryProps,
	ErrorBoundaryState,
} from "./types";

function resetKeysChanged(
	prev?: ReadonlyArray<unknown>,
	next?: ReadonlyArray<unknown>,
): boolean {
	if (prev === next) {
		return false;
	}
	if (!prev || !next || prev.length !== next.length) {
		return true;
	}
	return prev.some((value, index) => !Object.is(value, next[index]));
}

/**
 * Isolates a render exception to this subtree so the rest of the UI stays up.
 * Does not catch event-handler, async, or SSR (`renderToString`) errors.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	static displayName = "ErrorBoundary";

	override state: ErrorBoundaryState = {error: null};

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {error};
	}

	override componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("[mapsight] UI region failed to render", error);
		if (info.componentStack) {
			console.error(info.componentStack);
		}
		this.props.onError?.(error, info);
	}

	override componentDidUpdate(prevProps: ErrorBoundaryProps) {
		if (
			this.state.error &&
			resetKeysChanged(prevProps.resetKeys, this.props.resetKeys)
		) {
			this.reset();
		}
	}

	reset = () => {
		this.setState({error: null});
	};

	override render(): ReactNode {
		const {error} = this.state;
		if (!error) {
			return this.props.children;
		}

		const variant = this.props.variant ?? "region";
		const {fallback} = this.props;

		if (typeof fallback === "function") {
			return fallback({error, reset: this.reset, variant});
		}
		if (fallback !== undefined) {
			return fallback;
		}

		return (
			<ErrorBoundaryFallback
				error={error}
				reset={this.reset}
				variant={variant}
			/>
		);
	}
}

export default ErrorBoundary;
export type {ErrorBoundaryFallbackProps, ErrorBoundaryProps};
