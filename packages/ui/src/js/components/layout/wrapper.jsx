import {memo, useContext} from "react";
import {useSelector} from "react-redux";

import {ComponentsContext} from "../../helpers/components";
import {
	isEmbeddedMapSelector,
	mapVisible,
	viewSelector,
} from "../../store/selectors";

import "./host-slots";

function AppWrapper({children, ...attributes}) {
	const view = useSelector(viewSelector);
	const isEmbeddedMap = useSelector(isEmbeddedMapSelector);
	const isMapVisible = useSelector(mapVisible);
	const {AppWrapperStart} = useContext(ComponentsContext);

	const className = `ms3-wrapper ms3-wrapper--${view} ${
		isEmbeddedMap ? "ms3-wrapper--embedded" : ""
	} ${isMapVisible ? "" : "ms3-wrapper--withoutmap"} ${
		attributes.className || ""
	}`;

	return (
		<div className={className} {...attributes}>
			{AppWrapperStart ? <AppWrapperStart /> : null}
			{children}
		</div>
	);
}

export default memo(AppWrapper);
