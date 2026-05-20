import  {memo} from "react";
import {useSelector} from "react-redux";

import {
	isEmbeddedMapSelector,
	mapVisible,
	viewSelector,
} from "../../store/selectors";

function AppWrapper({children, ...attributes}) {
	const view = useSelector(viewSelector);
	const isEmbeddedMap = useSelector(isEmbeddedMapSelector);
	const isMapVisible = useSelector(mapVisible);

	const className = `ms3-wrapper ms3-wrapper--${view} ${
		isEmbeddedMap ? "ms3-wrapper--embedded" : ""
	} ${isMapVisible ? "" : "ms3-wrapper--withoutmap"} ${
		attributes.className || ""
	}`;

	return (
		<div className={className} {...attributes}>
			{children}
		</div>
	);
}

export default memo(AppWrapper);
