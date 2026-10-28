import type {CSSProperties, MouseEvent} from "react";
import {memo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {animate} from "@mapsight/core/lib/map/actions";

import {ZOOM_IN, ZOOM_OUT} from "../../config/constants/app";
import * as c from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";

export type ZoomButtonProps = {
	action: typeof ZOOM_IN | typeof ZOOM_OUT;
	additionalClasses?: string;
	baseClass?: string;
	zoomModifierClassPrefix?: string;
	style?: CSSProperties;
};

const zoomSelector = (state: {[c.MAP]?: {view?: {zoom?: number}}}) =>
	(state && state[c.MAP] && state[c.MAP].view && state[c.MAP].view.zoom) || 0;

function getAriaLabel(action: ZoomButtonProps["action"]) {
	return translate("ui.zoom-button.ariaLabel" + action);
}

function getLabel(action: ZoomButtonProps["action"]) {
	return translate("ui.zoom-button.label" + action);
}

function ZoomButton(props: ZoomButtonProps) {
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
		function onClick(e: MouseEvent<HTMLButtonElement>) {
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
