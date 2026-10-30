import {useCallback, useEffect, useId, useRef, useState} from "react";
import {useSelector, useStore} from "react-redux";

import type OlMap from "ol/Map";
import GeoJSON from "ol/format/GeoJSON";
import {
	equivalent,
	get as getProjection,
	getUserProjection,
	transform,
} from "ol/proj";
import type {ProjectionLike} from "ol/proj";

import {setData} from "@mapsight/core/lib/feature-sources/actions";
import type {
	FeatureSourceData,
	FeatureSourcesState,
} from "@mapsight/core/lib/feature-sources/types";
import type {MapController} from "@mapsight/core/lib/map/controller";
import type {EnhancedStore} from "@mapsight/core/types";

import {FEATURE_SOURCES, MAP} from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";
import {
	bindMapTargetKeyboard,
	whenViewSettled,
} from "../../helpers/map-target-keyboard";
import Modal from "../modal";

export type PointInputControlsProps = {
	featureSourceId: string;
	mapControllerName?: string;
	featureSourcesControllerName?: string;
	/**
	 * Projection of the editor's GeoJSON source. Defaults to the projection of
	 * the VectorFeatureSource bound to `featureSourceId` in map state.
	 */
	featureProjection?: ProjectionLike;
	featureId?: string;
	/** Render only for point input, or disable when another editor mode is active. */
	enabled?: boolean;
};

const GEOGRAPHIC = "EPSG:4326";
const geoJson = new GeoJSON();

function centerIn(map: OlMap | null, projection: ProjectionLike) {
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

const latLon = (point: number[]) =>
	`${point[1]!.toFixed(5)}, ${point[0]!.toFixed(5)}`;

/** Lat/lon of the single stored point: a named `crs`, else the source projection. */
function storedLatLon(
	data: FeatureSourceData | null | undefined,
	projection: ProjectionLike,
) {
	const geometry =
		data?.features?.length === 1 ? data.features[0]?.geometry : undefined;
	if (geometry?.type !== "Point") return undefined;
	try {
		const dataProjection =
			data!.crs !== undefined ? geoJson.readProjection(data) : projection;
		return latLon(
			transform(geometry.coordinates, dataProjection, GEOGRAPHIC),
		);
	} catch {
		return undefined;
	}
}

type Described = {
	options?: {
		source?: {
			type?: string;
			options?: {featureSourceId?: string; projection?: ProjectionLike};
		};
	} | null;
} | null;

/** Projection of the VectorFeatureSource that map state binds to the source id. */
function sourceProjection(mapState: unknown, featureSourceId: string) {
	const {layers, interactions} = (mapState ?? {}) as {
		layers?: Record<string, Described>;
		interactions?: Record<string, Described>;
	};
	for (const entry of [
		...Object.values(layers ?? {}),
		...Object.values(interactions ?? {}),
	]) {
		const source = entry?.options?.source;
		if (
			source?.type === "VectorFeatureSource" &&
			source.options?.featureSourceId === featureSourceId
		)
			return source.options.projection;
	}
	return undefined;
}

/** Opt-in point editor controls. Pointer drawing can keep using the same source. */
export default function PointInputControls({
	featureSourceId,
	mapControllerName = MAP,
	featureSourcesControllerName = FEATURE_SOURCES,
	featureProjection,
	featureId = `${featureSourceId}-point`,
	enabled = true,
}: PointInputControlsProps) {
	const store = useStore() as EnhancedStore;
	const map = (
		store.getController(mapControllerName) as MapController
	).getMap();
	const usageId = useId();
	const [position, setPosition] = useState("");
	const [available, setAvailable] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const projection = useSelector(
		(state: Record<string, unknown>) =>
			featureProjection ??
			sourceProjection(state[mapControllerName], featureSourceId) ??
			GEOGRAPHIC,
	);
	const stored = useSelector((state: Record<string, unknown>) =>
		storedLatLon(
			(
				state[featureSourcesControllerName] as
					FeatureSourcesState | undefined
			)?.[featureSourceId]?.data,
			projection,
		),
	);
	const pending = useRef<(() => void) | undefined>(undefined);

	const commit = useCallback(() => {
		pending.current = undefined;
		const target = getProjection(projection);
		const coordinates = target && centerIn(map, target);
		if (!target || !coordinates) return;
		const previous = (
			store.getState()[featureSourcesControllerName] as
				FeatureSourcesState | undefined
		)?.[featureSourceId]?.data;
		// OL Draw.appendCoordinates supports lines/polygons only. Commit a Point
		// through the same Redux source used by the pointer editor instead.
		const data: FeatureSourceData = {
			...previous,
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					id: featureId,
					geometry: {type: "Point", coordinates},
					properties: {},
				},
			],
		};
		// A named `crs` must describe the coordinates written here. Older core
		// readers also assume EPSG:4326 without one, so name other projections.
		if (
			previous?.crs !== undefined ||
			!equivalent(target, getProjection(GEOGRAPHIC)!)
		)
			data.crs = {type: "name", properties: {name: target.getCode()}};
		store.dispatch(
			setData(featureSourcesControllerName, featureSourceId, data),
		);
		const point = centerIn(map, GEOGRAPHIC);
		if (point) setPosition(latLon(point));
	}, [
		map,
		projection,
		featureSourcesControllerName,
		featureSourceId,
		featureId,
		store,
	]);

	// Commit where the crosshair comes to rest, not mid-animation.
	const confirm = useCallback(() => {
		if (!enabled || !map) return;
		pending.current?.();
		pending.current = whenViewSettled(map.getView(), commit);
	}, [enabled, map, commit]);

	useEffect(() => {
		if (!map || !enabled) return;
		// Announce on moveend only; the live region must not change per frame.
		const updatePosition = () => {
			const point = centerIn(map, GEOGRAPHIC);
			setAvailable(Boolean(point));
			setPosition(point ? latLon(point) : "");
		};
		const keyboard = bindMapTargetKeyboard(map, {
			crosshairClass: "ms3-map-target--point-input",
			describedBy: usageId,
			onKey: ({key}) =>
				key === "Enter" || key === " " ? commit : undefined,
		});
		map.on("moveend", updatePosition);
		updatePosition();
		return () => {
			pending.current?.();
			pending.current = undefined;
			keyboard.dispose();
			map.un("moveend", updatePosition);
		};
	}, [map, enabled, usageId, commit]);

	if (!enabled) return null;
	const confirmed = position !== "" && position === stored;
	return (
		<>
			<div className="ms3-point-input-controls">
				<p id={usageId} className="ms3-visuallyhidden">
					{translate("ui.point-input.instructions")}
				</p>
				<div className="ms3-point-input-controls__actions">
					<button
						type="button"
						disabled={!available}
						onClick={confirm}
					>
						{translate("ui.point-input.confirm")}
					</button>
					<button
						type="button"
						aria-label={translate("ui.point-input.help")}
						onClick={() => setShowHelp(true)}
					>
						?
					</button>
				</div>
				<p role="status">
					{position &&
						`${translate(confirmed ? "ui.point-input.confirmed" : "ui.point-input.position")} ${position}`}
				</p>
			</div>
			<Modal
				isOpen={showHelp}
				contentLabel={translate("ui.point-input.help")}
				onRequestClose={() => setShowHelp(false)}
				headline={translate("ui.point-input.help")}
				closeLabel={translate("ui.point-input.close-help")}
			>
				<p>{translate("ui.point-input.instructions")}</p>
			</Modal>
		</>
	);
}
