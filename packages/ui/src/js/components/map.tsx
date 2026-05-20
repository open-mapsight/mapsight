import type {HTMLAttributes} from "react";
import {memo, useEffect, useMemo, useRef} from "react";
import {useStore} from "react-redux";

import type {EnhancedStore} from "@mapsight/core/types";

import {MAP} from "../config/constants/controllers";
import {translate} from "../helpers/i18n";
import useMountable, {isMountable} from "../hooks/useMountable";

type MapsightMapProps = HTMLAttributes<HTMLDivElement> & {
	controllerName?: string;
	enableKeyboardControl?: boolean;
};

function MapsightMap({
	controllerName = MAP,
	enableKeyboardControl = true,
	...attributes
}: MapsightMapProps) {
	const store = useStore() as EnhancedStore;
	const ref = useRef<HTMLDivElement>(null);

	const mountable = useMemo(() => {
		const controller = store.getController(controllerName);
		if (!isMountable(controller)) {
			console.error(`Controller '${controllerName}' is not mountable`);
			return undefined;
		}
		return controller;
	}, [store, controllerName]);
	const handleMount = useMountable(mountable);
	useEffect(() => {
		if (ref.current) {
			handleMount(ref.current);
		}
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
