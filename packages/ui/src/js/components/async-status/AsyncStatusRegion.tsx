import type {ReactNode} from "react";
import {memo, useCallback} from "react";

import {makeReplaceableComponent} from "../../helpers/components";
import {translate} from "../../helpers/i18n";
import type {AsyncStatusView} from "../../lib/async-status";
import {useAsyncStatusDisplay} from "../../lib/async-status";
import AsyncStatusIndicator from "./AsyncStatusIndicator";

export type AsyncStatusRegionProps<T = unknown> = {
	view: AsyncStatusView<T>;
	children?: ReactNode;
	variant?: "inline" | "placeholder" | "overlay";
	delayMs?: number;
	minVisibleMs?: number;
	showRefreshIndicator?: boolean;
	errorWithStaleData?: "banner" | "replace";
	loadingMessage?: ReactNode;
	errorMessage?: ReactNode;
	emptyMessage?: ReactNode;
	refreshingMessage?: ReactNode;
	pausedMessage?: ReactNode;
	onRetry?: () => void;
	isEmpty?: (data: T | undefined) => boolean;
	className?: string;
	contentClassName?: string;
};

function AsyncStatusRegion<T = unknown>({
	view,
	children,
	variant = "placeholder",
	delayMs,
	minVisibleMs,
	showRefreshIndicator,
	errorWithStaleData,
	loadingMessage,
	errorMessage,
	emptyMessage,
	refreshingMessage,
	pausedMessage,
	onRetry,
	isEmpty,
	className = "",
	contentClassName = "",
}: AsyncStatusRegionProps<T>) {
	const display = useAsyncStatusDisplay(view, {
		delayMs,
		minVisibleMs,
		showRefreshIndicator,
		errorWithStaleData,
		isEmpty: isEmpty as (data: unknown) => boolean,
	});

	const handleRetry = useCallback(() => {
		if (onRetry) {
			onRetry();
			return;
		}
		view.refetch?.();
	}, [onRetry, view]);

	const retryAction =
		onRetry || view.refetch ? (
			<button
				className="ms3-async-status__retry"
				onClick={handleRetry}
				type="button"
			>
				{translate("ui.async-status.retry")}
			</button>
		) : null;

	const regionClassName = [
		"ms3-async-status-region",
		display.phase === "refreshing"
			? "ms3-async-status-region--refreshing"
			: "",
		className,
	]
		.filter(Boolean)
		.join(" ");

	if (display.phase === "hidden") {
		return null;
	}

	if (display.phase === "loading") {
		return (
			<div aria-busy={true} className={regionClassName}>
				<AsyncStatusIndicator
					message={loadingMessage}
					phase="loading"
					variant={variant}
				/>
			</div>
		);
	}

	if (display.phase === "error") {
		return (
			<div aria-busy={false} className={regionClassName}>
				<AsyncStatusIndicator
					error={
						<>
							<span className="ms3-async-status__message">
								{errorMessage ??
									translate("ui.async-status.error")}
							</span>
							{retryAction}
						</>
					}
					phase="error"
					variant={variant}
				/>
			</div>
		);
	}

	if (display.phase === "empty") {
		return (
			<div aria-busy={false} className={regionClassName}>
				{emptyMessage}
			</div>
		);
	}

	const showErrorBanner =
		display.showError &&
		display.phase === "refreshing" &&
		errorWithStaleData !== "replace";

	return (
		<div
			aria-busy={display.phase === "refreshing" && display.showRefreshing}
			className={regionClassName}
		>
			{display.isPaused && pausedMessage ? (
				<div className="ms3-async-status-region__paused">
					{pausedMessage}
				</div>
			) : null}

			{showErrorBanner ? (
				<div
					className="ms3-async-status-region__error-banner"
					role="alert"
				>
					<span className="ms3-async-status-region__error-banner-message">
						{errorMessage ?? translate("ui.async-status.error")}
					</span>
					{retryAction}
				</div>
			) : null}

			<div className={contentClassName || undefined}>{children}</div>

			{display.showRefreshing ? (
				<AsyncStatusIndicator
					className="ms3-async-status-region__refresh-indicator"
					message={refreshingMessage}
					phase="refreshing"
					variant="inline"
				/>
			) : null}
		</div>
	);
}

export default makeReplaceableComponent(
	"AsyncStatusRegion",
	memo(AsyncStatusRegion) as typeof AsyncStatusRegion,
);
export {AsyncStatusRegion as NonReplaceableAsyncStatusRegion};

declare module "../../helpers/components" {
	interface ComponentProps {
		AsyncStatusRegion: AsyncStatusRegionProps;
	}
}
