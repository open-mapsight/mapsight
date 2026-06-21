import type {ReactNode} from "react";
import {memo} from "react";

import {makeReplaceableComponent} from "../../helpers/components";
import {translate} from "../../helpers/i18n";

export type AsyncStatusIndicatorProps = {
	phase: "loading" | "error" | "refreshing";
	variant?: "inline" | "icon" | "placeholder" | "overlay";
	message?: ReactNode;
	error?: ReactNode;
	className?: string;
	"aria-live"?: "polite" | "assertive" | "off";
};

function AsyncStatusIndicator({
	phase,
	variant = "placeholder",
	message,
	error,
	className = "",
	"aria-live": ariaLive = "polite",
}: AsyncStatusIndicatorProps) {
	const resolvedMessage =
		message ??
		(phase === "loading"
			? translate("ui.async-status.loading")
			: phase === "error"
				? translate("ui.async-status.error")
				: translate("ui.async-status.refreshing"));

	return (
		<div
			aria-live={ariaLive}
			className={`ms3-async-status ms3-async-status--${phase} ms3-async-status--${variant} ${className}`.trim()}
			role={phase === "error" ? "alert" : "status"}
		>
			{phase === "error" && error ? (
				error
			) : (
				<span className="ms3-async-status__message">
					{resolvedMessage}
				</span>
			)}
		</div>
	);
}

export default makeReplaceableComponent(
	"AsyncStatusIndicator",
	memo(AsyncStatusIndicator),
);
export {AsyncStatusIndicator as NonReplaceableAsyncStatusIndicator};

declare module "../../helpers/components" {
	interface ComponentProps {
		AsyncStatusIndicator: AsyncStatusIndicatorProps;
	}
}
