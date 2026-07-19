import {Children, type PropsWithChildren} from "react";

/**
 * Groups map-overlay buttons (e.g. zoom +/-) so host CSS can share a single
 * border between siblings via `.ms3-map-overlay-combined-buttons__button`.
 *
 * Hosts typically style:
 *   `__button:not(:last-child) > .ms3-map-overlay__button { border-bottom: none; … }`
 * Flattening children into the outer div breaks that shared-border look.
 */
function CombinedButtons({children}: PropsWithChildren) {
	return (
		<div className="ms3-map-overlay-combined-buttons">
			{Children.map(children, (child) => (
				<div className="ms3-map-overlay-combined-buttons__button">
					{child}
				</div>
			))}
		</div>
	);
}

export default CombinedButtons;
