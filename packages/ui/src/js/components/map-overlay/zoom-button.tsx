import type {CSSProperties, MouseEvent} from "react";
import {memo, useCallback} from "react";

import {ZOOM_IN, ZOOM_OUT} from "../../config/constants/app";
import {translate} from "../../helpers/i18n";
import useMapZoom from "../../hooks/useMapZoom";

export type ZoomButtonProps = {
	action: typeof ZOOM_IN | typeof ZOOM_OUT;
	additionalClasses?: string;
	baseClass?: string;
	zoomModifierClassPrefix?: string;
	style?: CSSProperties;
};

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

	const {zoomIn, zoomOut} = useMapZoom();

	const onClick = useCallback(
		function onClick(e: MouseEvent<HTMLButtonElement>) {
			e.stopPropagation();

			switch (action) {
				case ZOOM_IN:
					zoomIn();
					break;

				case ZOOM_OUT:
					zoomOut();
					break;

				default:
					throw new Error("Unsupported action");
			}
		},
		[action, zoomIn, zoomOut],
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
