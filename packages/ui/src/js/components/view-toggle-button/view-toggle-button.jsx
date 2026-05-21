import {memo, useCallback} from "react";
import {useSelector} from "react-redux";

import {
	VIEW_DESKTOP,
	VIEW_FULLSCREEN,
	VIEW_MAP_ONLY,
	VIEW_MOBILE,
} from "../../config/constants/app";
import {translate} from "../../helpers/i18n";
import {viewSelector} from "../../store/selectors";

function getOtherView(view) {
	switch (view) {
		case VIEW_MAP_ONLY:
			return VIEW_MOBILE;
		case VIEW_FULLSCREEN:
			return VIEW_DESKTOP;
		case VIEW_DESKTOP:
			return VIEW_FULLSCREEN;
		case VIEW_MOBILE:
		default:
			return VIEW_MAP_ONLY;
	}
}

function getAriaLabel(view) {
	return translate("ui.view-toggle-button.ariaLabel" + view);
}

function getLabel(view) {
	return translate("ui.view-toggle-button.label" + view);
}

function ViewToggleButton({
	isMapOutOfViewport = false,
	changeView,

	additionalClasses = "",
	baseClass = "button",
	viewModifierClassPrefix = "button--",

	style = {},
}) {
	const view = useSelector(viewSelector);
	const otherView = getOtherView(view);

	const onClick = useCallback(
		function onClick(e) {
			e.stopPropagation();
			changeView(view, otherView);
		},
		[changeView, view, otherView],
	);

	let className = `${baseClass} ${viewModifierClassPrefix}${view} ${additionalClasses}`;
	if (isMapOutOfViewport) {
		className += ` ${viewModifierClassPrefix}map-out-of-view`;
	}

	return (
		<button
			type="button"
			style={style}
			className={className}
			onClick={onClick}
			aria-label={getAriaLabel(otherView)}
		>
			<span className={`${baseClass}__label`}>{getLabel(otherView)}</span>
		</button>
	);
}

export default memo(ViewToggleButton);
