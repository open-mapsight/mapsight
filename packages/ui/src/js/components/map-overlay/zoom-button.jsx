import {animate} from "@mapsight/core/lib/map/actions";
import  {memo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";
import {ZOOM_IN, ZOOM_OUT} from "../../config/constants/app";
import * as c from "../../config/constants/controllers";

import {translate} from "../../helpers/i18n";

const zoomSelector = (state) =>
	(state && state[c.MAP] && state[c.MAP].view && state[c.MAP].view.zoom) || 0;

/**
 * @param {ZOOM_IN | ZOOM_OUT} action action
 * @returns {string} label
 */
function getAriaLabel(action) {
	return translate("ui.zoom-button.ariaLabel" + action);
}

/**
 * @param {ZOOM_IN | ZOOM_OUT} action action
 * @returns {string} label
 */
function getLabel(action) {
	return translate("ui.zoom-button.label" + action);
}

/**
 * @param {{
 *   action: ZOOM_IN | ZOOM_OUT,
 *   style?: import('react').CSSProperties,
 *   additionalClasses?: string,
 *   baseClass?: string,
 *   zoomModifierClassPrefix?: string
 * }} props props
 * @returns {import('react').ReactElement} element
 */
function ZoomButton(props) {
	const {
		action,

		// no need for separation of concerns, we just pass everything into the "component"
		additionalClasses = "",
		baseClass = "button",
		zoomModifierClassPrefix = "button--",
		style = {},
	} = props;

	const dispatch = useDispatch();
	const zoom = useSelector(zoomSelector);

	const onClick = useCallback(
		/** @param {import('react').MouseEvent} e event */
		function onClick(e) {
			e.stopPropagation();

			switch (action) {
				case ZOOM_IN:
					dispatch(
						animate(c.MAP, {
							zoom: zoom + 1,
							duration: 200,
						}),
					);
					break;

				case ZOOM_OUT:
					dispatch(
						animate(c.MAP, {
							zoom: zoom - 1,
							duration: 200,
						}),
					);
					break;

				default:
					throw new Error("Unsupported action");
			}
		},
		[dispatch, action, zoom],
	);

	const className = `${baseClass} ${zoomModifierClassPrefix}${action} ${additionalClasses}`;

	return (
		<button
			type="button"
			className={className}
			onClick={onClick}
			aria-label={getAriaLabel(action)}
			style={style}
		>
			<span className={`${baseClass}__label`}>{getLabel(action)}</span>
		</button>
	);
}

export default memo(ZoomButton);
