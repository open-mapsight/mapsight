import {isDevelopment} from "@mapsight/core/lib/helpers";

import {translate} from "../../helpers/i18n";
import type {ErrorBoundaryFallbackProps} from "./types";

const MESSAGE_KEYS = {
	page: "ui.error-boundary.page",
	region: "ui.error-boundary.region",
	overlay: "ui.error-boundary.overlay",
} as const;

function ErrorBoundaryFallback({
	error,
	reset,
	variant,
}: ErrorBoundaryFallbackProps) {
	return (
		<div
			className={`ms3-error-boundary ms3-error-boundary--${variant}`}
			role="alert"
		>
			<p className="ms3-error-boundary__message">
				{translate(MESSAGE_KEYS[variant])}
			</p>
			<button
				className="ms3-error-boundary__retry"
				onClick={reset}
				type="button"
			>
				{translate("ui.error-boundary.retry")}
			</button>
			{isDevelopment() && error.message ? (
				<pre className="ms3-error-boundary__detail">
					{error.message}
				</pre>
			) : null}
		</div>
	);
}

export default ErrorBoundaryFallback;
