import type {PropsWithChildren, ReactNode} from "react";
import {memo, useCallback, useContext, useEffect, useRef} from "react";

import {ComponentsContext} from "../../helpers/components";
import getFeatureProperty from "../../helpers/get-feature-property";
import {translate} from "../../helpers/i18n";
import type {MapsightUiFeature} from "../../types";

export type Props = PropsWithChildren<{
	feature: MapsightUiFeature;
	url?: string;
	hasError: boolean;
	html?: string;
	handleContentChange?: (element: HTMLElement | null) => void;
}>;

function FeatureDetailsContentInner({
	feature,
	url,
	hasError,
	html,
	handleContentChange,
}: Props) {
	const comps = useContext(ComponentsContext);

	// NOTE(PG): using useCallback in addition to useRef alone so we actually get called when node changes
	const containerRef = useRef<HTMLElement | null>(null);
	const containerRefSetter = useCallback(
		(element: HTMLElement | null) => {
			containerRef.current = element;
			if (element && handleContentChange) {
				handleContentChange(element);
			}
		},
		[handleContentChange],
	);

	const desc = getFeatureProperty(feature, "description");

	// NOTE(PG): Using useEffect to detect content changes (here: props), maybe we could move this up into the parent comp?
	useEffect(() => {
		handleContentChange?.(containerRef.current);
	}, [handleContentChange, html, hasError, desc]);

	let content: ReactNode = null;
	if (url) {
		if (html) {
			// success
			content = (
				<div
					className="ms3-feature-details-content ms3-feature-details-content--html"
					dangerouslySetInnerHTML={{__html: html}}
					ref={containerRefSetter}
				/>
			);
		} else if (hasError) {
			// error
			content = (
				<div
					className="ms3-feature-details-content ms3-feature-details-content--error"
					ref={containerRefSetter}
				>
					{translate("ui.feature-details.content-inner.error")}
					<br />

					<a href={url}>
						{translate("ui.feature-details.content-inner.gotoPage")}
					</a>
				</div>
			);
		} else {
			// loading
			content = (
				<div
					className="ms3-feature-details-content ms3-feature-details-content--loading"
					ref={containerRefSetter}
				>
					{translate("ui.feature-details.content-inner.loading")}
				</div>
			);
		}
	} else {
		if (desc) {
			content = (
				<div
					className="ms3-feature-details-content ms3-feature-details-content--description"
					dangerouslySetInnerHTML={{__html: desc}}
					ref={containerRefSetter}
				/>
			);
		}
	}

	if (comps.FeatureDetailsContent) {
		content = (
			<comps.FeatureDetailsContent
				feature={feature}
				url={url}
				hasError={hasError}
				html={html}
			>
				{content}
			</comps.FeatureDetailsContent>
		);
	}

	return content;
}

export default memo(FeatureDetailsContentInner);

declare module "../../helpers/components" {
	interface ComponentProps {
		FeatureDetailsContent: Props;
	}
}
