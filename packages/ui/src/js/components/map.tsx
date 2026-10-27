import type {HTMLAttributes} from "react";
import {memo, useEffect, useId, useMemo, useRef} from "react";
import {useStore} from "react-redux";

import type {EnhancedStore} from "@mapsight/core/types";

import {MAP} from "../config/constants/controllers";
import {translate} from "../helpers/i18n";
import useMountable, {isMountable} from "../hooks/useMountable";

type MapsightMapProps = HTMLAttributes<HTMLDivElement> & {
	controllerName?: string;
	enableKeyboardControl?: boolean;
	/** Accessible map title. Hosts can also pass aria-label or aria-labelledby. */
	mapTitle?: string;
};

function MapsightMap({
	controllerName = MAP,
	enableKeyboardControl = true,
	mapTitle = translate("ui.map.label"),
	...attributes
}: MapsightMapProps) {
	const usageId = useId();
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
		<>
			<div
				className="ms3-map-target"
				ref={ref}
				role="region"
				aria-roledescription={translate("ui.map.roledescription")}
				aria-label={mapTitle}
				{...attributes}
				aria-describedby={
					[
						enableKeyboardControl && usageId,
						attributes["aria-describedby"],
					]
						.filter(Boolean)
						.join(" ") || undefined
				}
			>
				<span className="ms3-visuallyhidden">
					{translate("ui.map.visuallyhidden")}
				</span>
				<div className="ol-viewport">
					<canvas className="ol-unselectable" />
				</div>
			</div>
			{enableKeyboardControl && (
				<div
					id={usageId}
					className="ms3-visuallyhidden"
					dangerouslySetInnerHTML={{
						__html: translate("ui.map.usage.html"),
					}}
				/>
			)}
		</>
	);
}

export default memo(MapsightMap);
