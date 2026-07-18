import {memo, useContext} from "react";
import {useSelector} from "react-redux";

import {ComponentsContext} from "../../helpers/components";
import {
	isEmbeddedMapSelector,
	mapVisible,
	viewSelector,
} from "../../store/selectors";

import "./host-slots";

function AppWrapper({children, className: classNameProp = "", ...attributes}) {
	const view = useSelector(viewSelector);
	const isEmbeddedMap = useSelector(isEmbeddedMapSelector);
	const isMapVisible = useSelector(mapVisible);
	const {AppWrapperStart} = useContext(ComponentsContext);

	const className = [
		"ms3-wrapper",
		`ms3-wrapper--${view}`,
		isEmbeddedMap ? "ms3-wrapper--embedded" : "",
		isMapVisible ? "" : "ms3-wrapper--withoutmap",
		classNameProp,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div {...attributes} className={className}>
			{AppWrapperStart ? <AppWrapperStart /> : null}
			{children}
		</div>
	);
}

export default memo(AppWrapper);
