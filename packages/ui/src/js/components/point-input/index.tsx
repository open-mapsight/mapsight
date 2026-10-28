import {useCallback, useEffect, useId, useState} from "react";
import {useStore} from "react-redux";

import type OlMap from "ol/Map";
import {getUserProjection, transform} from "ol/proj";
import type {ProjectionLike} from "ol/proj";

import {setData} from "@mapsight/core/lib/feature-sources/actions";
import type {MapController} from "@mapsight/core/lib/map/controller";
import type {EnhancedStore} from "@mapsight/core/types";

import {FEATURE_SOURCES, MAP} from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";

export type PointInputControlsProps = {
	featureSourceId: string;
	mapControllerName?: string;
	featureSourcesControllerName?: string;
	/** Projection of the editor's GeoJSON source, not the map view. */
	featureProjection?: ProjectionLike;
	featureId?: string;
	/** Render only for point input, or disable when another editor mode is active. */
	enabled?: boolean;
};

function centerInProjection(map: OlMap | null, projection: ProjectionLike) {
	const view = map?.getView();
	const center = view?.getCenter();
	if (!view || !center) return undefined;
	const point = transform(
		center,
		getUserProjection() ?? view.getProjection(),
		projection,
	);
	return point.length >= 2 && point.every(Number.isFinite)
		? point
		: undefined;
}

/** Opt-in point editor controls. Pointer drawing can keep using the same source. */
export default function PointInputControls({
	featureSourceId,
	mapControllerName = MAP,
	featureSourcesControllerName = FEATURE_SOURCES,
	featureProjection = "EPSG:4326",
	featureId = `${featureSourceId}-point`,
	enabled = true,
}: PointInputControlsProps) {
	const store = useStore() as EnhancedStore;
	const map = (
		store.getController(mapControllerName) as MapController
	).getMap();
	const usageId = useId();
	const [position, setPosition] = useState("");
	const [confirmed, setConfirmed] = useState(false);
	const [available, setAvailable] = useState(false);
	const confirm = useCallback(() => {
		if (!enabled) return;
		const coordinates = centerInProjection(map, featureProjection);
		if (!coordinates) return;
		// OL Draw.appendCoordinates supports lines/polygons only. Commit a Point
		// through the same Redux source used by the pointer editor instead.
		store.dispatch(
			setData(featureSourcesControllerName, featureSourceId, {
				type: "FeatureCollection",
				features: [
					{
						type: "Feature",
						id: featureId,
						geometry: {type: "Point", coordinates},
						properties: {},
					},
				],
			}),
		);
		setConfirmed(true);
	}, [
		enabled,
		map,
		featureProjection,
		featureSourcesControllerName,
		featureSourceId,
		featureId,
		store,
	]);

	useEffect(() => {
		if (!map || !enabled) return;
		let target: HTMLElement | undefined;
		let view = map.getView();
		const updatePosition = () => {
			const point = centerInProjection(map, "EPSG:4326");
			setAvailable(Boolean(point));
			setPosition(
				point ? `${point[1]!.toFixed(6)}, ${point[0]!.toFixed(6)}` : "",
			);
			setConfirmed(false);
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (
				event.target !== target ||
				target?.ownerDocument.activeElement !== target ||
				event.defaultPrevented ||
				event.repeat ||
				event.isComposing ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey ||
				event.key !== "Enter"
			)
				return;
			event.preventDefault();
			confirm();
		};
		const updateCrosshair = () => {
			if (!target) return;
			target.classList.toggle(
				"ms3-map-target--point-input",
				target.ownerDocument.activeElement === target,
			);
			const center = map.getView().getCenter();
			const pixel = center && map.getPixelFromCoordinate(center);
			// View padding can move its centre away from the viewport's 50%/50%.
			if (pixel) {
				target.style.setProperty(
					"--ms3-point-input-x",
					`${pixel[0]}px`,
				);
				target.style.setProperty(
					"--ms3-point-input-y",
					`${pixel[1]}px`,
				);
			}
		};
		const detach = () => {
			if (!target) return;
			target.removeEventListener("keydown", onKeyDown);
			target.removeEventListener("focus", updateCrosshair);
			target.removeEventListener("blur", updateCrosshair);
			target.classList.remove("ms3-map-target--point-input");
			target.style.removeProperty("--ms3-point-input-x");
			target.style.removeProperty("--ms3-point-input-y");
			const ids = (target.getAttribute("aria-describedby") ?? "")
				.split(/\s+/)
				.filter((id) => id && id !== usageId);
			if (ids.length)
				target.setAttribute("aria-describedby", ids.join(" "));
			else target.removeAttribute("aria-describedby");
		};
		const attach = () => {
			detach();
			target = map.getTargetElement() ?? undefined;
			if (!target) return;
			target.addEventListener("keydown", onKeyDown);
			target.addEventListener("focus", updateCrosshair);
			target.addEventListener("blur", updateCrosshair);
			target.setAttribute(
				"aria-describedby",
				[target.getAttribute("aria-describedby"), usageId]
					.filter(Boolean)
					.join(" "),
			);
			updateCrosshair();
		};
		const watchView = () => {
			view.un("change:center", updatePosition);
			view = map.getView();
			view.on("change:center", updatePosition);
			updatePosition();
		};
		map.on("postrender", updateCrosshair);
		map.on("change:target", attach);
		map.on("change:view", watchView);
		watchView();
		attach();
		return () => {
			detach();
			view.un("change:center", updatePosition);
			map.un("postrender", updateCrosshair);
			map.un("change:target", attach);
			map.un("change:view", watchView);
		};
	}, [map, enabled, usageId, confirm]);

	if (!enabled) return null;
	return (
		<div className="ms3-point-input-controls">
			<p id={usageId}>{translate("ui.point-input.instructions")}</p>
			<button type="button" disabled={!available} onClick={confirm}>
				{translate("ui.point-input.confirm")}
			</button>
			<p role="status">
				{position &&
					`${translate(confirmed ? "ui.point-input.confirmed" : "ui.point-input.position")} ${position}`}
			</p>
		</div>
	);
}
