import {memo} from "react";

import type {LayerAttributionParts} from "@mapsight/core/lib/map/selectors";

import {useFutureFlag} from "../../future/context";

/**
 * One entry per key. A plain string is markup and always rendered as HTML
 * (legends, and callers from before attribution parts existed). For attribution
 * parts, `html` is rendered as HTML; `text` is rendered as HTML too unless
 * `future.v8_attributionText` is enabled, which renders it as a plain text
 * node. In v8, `text` is always plain text.
 */
export type AttributionEntryValue = string | LayerAttributionParts;

function AttributionEntries({
	children,
	attributions,
}: {
	children?: React.ReactNode;
	attributions?: {[key: string]: AttributionEntryValue};
}) {
	const attributionText = useFutureFlag("v8_attributionText");

	return (
		<div className="ms3-attribution">
			<ul className="ms3-attribution__entries">
				{attributions &&
					Object.entries(attributions).map(([key, value]) => {
						const {text, html} =
							typeof value === "string" ? {html: value} : value;
						const markup = html || (attributionText ? "" : text);

						return markup ? (
							<li
								className="ms3-attribution__entry"
								key={key}
								dangerouslySetInnerHTML={{__html: markup}}
							/>
						) : (
							<li className="ms3-attribution__entry" key={key}>
								{text}
							</li>
						);
					})}
				{children && (
					<li className="ms3-attribution__entry ms3-attribution__entry--additional">
						{children}
					</li>
				)}
			</ul>
		</div>
	);
}

export default memo(AttributionEntries);
