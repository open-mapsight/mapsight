import {memo, useCallback} from "react";
import {useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import {pairedView} from "../../helpers/view-pairing";
import {viewSelector} from "../../store/selectors";

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
	const otherView = pairedView(view);

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
