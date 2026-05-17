import {memo, useEffect, useRef} from "react";
import {useStore} from "react-redux";
import {MAP} from "../config/constants/controllers";

import {translate} from "../helpers/i18n";
import useMountable from "../hooks/useMountable";

function MapsightMap({
	controllerName = MAP,
	enableKeyboardControl = true,
	...attributes
}) {
	const store = useStore();
	const ref = useRef();

	const handleMount = useMountable(store.getController(controllerName));
	useEffect(() => {
		handleMount(ref.current);
	}, [ref, handleMount]);

	if (enableKeyboardControl) {
		attributes.tabIndex = 0;
	}

	return (
		<div className="ms3-map-target" ref={ref} {...attributes}>
			<span className="ms3-visuallyhidden">
				{translate("ui.map.visuallyhidden")}
			</span>
			<div className="ol-viewport">
				<canvas className="ol-unselectable" />
			</div>
		</div>
	);
}

export default memo(MapsightMap);
