import proj4 from "proj4";

import {merge} from "@mapsight/core/lib/base/actions";
import {setLayerVisibility} from "@mapsight/core/lib/map/actions";
import type {MapController} from "@mapsight/core/lib/map/controller";
import type {LayerState} from "@mapsight/core/lib/map/types";
import type {EnhancedStore} from "@mapsight/core/types";

import {observeState} from "@mapsight/lib-redux/observe-state";

import {MAP} from "../../config/constants/controllers";
import type {MapsightUiContext, PluginInstance} from "../../types";

const WGS84 = "EPSG:4326";
const DEFAULT_VIEW_PROJECTION = "EPSG:3857";

export const DEFAULT_VIEW_PARAMETER = "map";
export const DEFAULT_LAYERS_PARAMETER = "layers";

const MAX_ZOOM = 28;
const MAX_VALUE_LENGTH = 4096;
const NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/;

export type ParsedView = {
	zoom: number;
	lat: number;
	lon: number;
	/** Clockwise rotation in degrees, 0 when the address names none. */
	rotation: number;
};

/**
 * Read and write access to the part of the address that carries the state.
 * Strings include the leading `#` or `?`; an empty string means no parameters.
 */
export type AddressAdapter = {
	read(): string;
	write(next: string): void;
};

export type LayerTracking =
	string[] | ((layerId: string, layer: LayerState) => boolean);

export type Options = {
	/** Name of the map controller. @default "map" */
	mapControllerName?: string;
	/** Parameter for the view (`zoom/lat/lon[/rotation]`). `false` disables it. @default "map" */
	viewParameter?: string | false;
	/** Parameter for visible layer ids (comma separated). `false` disables it. @default "layers" */
	layersParameter?: string | false;
	/** Where the parameters live. @default "hash" */
	location?: "hash" | "search";
	/**
	 * Layers whose visibility is part of the address: an id list or a
	 * predicate. Default: layers the user can toggle in a layer switcher.
	 */
	trackedLayers?: LayerTracking;
	/** Delay in ms before state changes are written. @default 250 */
	debounceMs?: number;
	/** Decimals for latitude and longitude. @default 5 */
	precision?: number;
	/**
	 * Replacement for `window.location` + `history.replaceState`, for hosts
	 * whose router owns the address.
	 */
	adapter?: AddressAdapter;
	/** Apply later `hashchange` / `popstate` address changes. @default true */
	followAddressChanges?: boolean;
};

export type ViewPermalinkPlugin = PluginInstance & {
	/**
	 * Remove listeners and subscriptions and cancel a pending write. The plugin
	 * lifecycle has no teardown phase, so hosts call this themselves.
	 */
	destroy(): void;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function stripTrailingZeros(fixed: string): string {
	const stripped = fixed.includes(".")
		? fixed.replace(/0+$/, "").replace(/\.$/, "")
		: fixed;
	return stripped === "-0" ? "0" : stripped;
}

function formatNumber(value: number, decimals: number): string {
	return stripTrailingZeros(value.toFixed(decimals));
}

function parseNumber(raw: string | undefined): number | null {
	if (raw === undefined || raw.length > 24 || !NUMBER_PATTERN.test(raw)) {
		return null;
	}
	const value = Number(raw);
	return Number.isFinite(value) ? value : null;
}

/** Longitude of a repeated world mapped into (-180, 180]. */
function normaliseLongitude(lon: number): number {
	const degrees = ((((lon + 180) % 360) + 360) % 360) - 180;
	return degrees === -180 ? 180 : degrees;
}

/**
 * `zoom/lat/lon[/rotation]` with WGS84 degrees; rotation only when non-zero.
 * Longitude and rotation are normalised. Returns `null` for a view the parser
 * would reject (non-finite numbers, zoom or latitude out of range), so that
 * everything produced here reads back.
 */
export function formatViewParameter(
	view: ParsedView,
	precision = 5,
): string | null {
	if (
		![view.zoom, view.lat, view.lon, view.rotation].every(Number.isFinite)
	) {
		return null;
	}
	const zoom = formatNumber(view.zoom, 2);
	const lat = formatNumber(view.lat, precision);
	if (
		Number(zoom) < 0 ||
		Number(zoom) > MAX_ZOOM ||
		Math.abs(Number(lat)) > 90
	) {
		return null;
	}
	const parts = [
		zoom,
		lat,
		formatNumber(normaliseLongitude(view.lon), precision),
	];
	// Normalise to (-180, 180] so equal orientations serialise equally.
	let degrees = ((((view.rotation + 180) % 360) + 360) % 360) - 180;
	if (degrees === -180) {
		degrees = 180;
	}
	const rotation = formatNumber(degrees, 1);
	if (rotation !== "0") {
		parts.push(rotation);
	}
	return parts.join("/");
}

/** Strict parser: malformed or out-of-range values yield `null`. */
export function parseViewParameter(
	value: string | null | undefined,
): ParsedView | null {
	if (!value || value.length > MAX_VALUE_LENGTH) {
		return null;
	}
	const parts = value.split("/");
	if (parts.length < 3 || parts.length > 4) {
		return null;
	}
	const zoom = parseNumber(parts[0]);
	const lat = parseNumber(parts[1]);
	const lon = parseNumber(parts[2]);
	const rotation = parts.length === 4 ? parseNumber(parts[3]) : 0;
	if (zoom === null || lat === null || lon === null || rotation === null) {
		return null;
	}
	if (
		zoom < 0 ||
		zoom > MAX_ZOOM ||
		Math.abs(lat) > 90 ||
		Math.abs(lon) > 180 ||
		Math.abs(rotation) > 360
	) {
		return null;
	}
	return {zoom, lat, lon, rotation};
}

/**
 * Percent-decodes a parameter value once, as a whole. `+` is a space, as in
 * the query serialisation (`URLSearchParams`) routers apply. `null` when the
 * value is malformed.
 */
export function decodeParameterValue(raw: string): string | null {
	try {
		return decodeURIComponent(raw.replace(/\+/g, " "));
	} catch {
		return null;
	}
}

/** Ids that cannot be told apart in a comma separated list are not representable. */
function isRepresentableLayerId(id: string): boolean {
	return id !== "" && !id.includes(",");
}

/**
 * Ids joined with commas, each percent-encoded. `null` when the list cannot be
 * represented: an id contains a comma or the text exceeds what the parser
 * accepts.
 */
export function formatLayersParameter(layerIds: string[]): string | null {
	if (!layerIds.every(isRepresentableLayerId)) {
		return null;
	}
	const text = layerIds.map((id) => encodeURIComponent(id)).join(",");
	return text.length > MAX_VALUE_LENGTH ? null : text;
}

/**
 * The value is percent-decoded once as a whole and then split on commas, so
 * `a,b` and `a%2Cb` mean the same. Returns the listed ids (empty list for an
 * empty value) or `null` if malformed.
 */
export function parseLayersParameter(
	value: string | null | undefined,
): string[] | null {
	if (value === null || value === undefined) {
		return null;
	}
	if (value.length > MAX_VALUE_LENGTH) {
		return null;
	}
	if (value === "") {
		return [];
	}
	const decoded = decodeParameterValue(value);
	if (decoded === null) {
		return null;
	}
	const ids: string[] = [];
	for (const id of decoded.split(",")) {
		if (id === "") {
			return null;
		}
		if (!ids.includes(id)) {
			ids.push(id);
		}
	}
	return ids;
}

function addressBody(address: string): string {
	return address.replace(/^[#?]/, "");
}

function segmentName(segment: string): string {
	const key = segment.split("=", 1)[0] ?? "";
	try {
		return decodeURIComponent(key);
	} catch {
		return key;
	}
}

/** Raw value of the first parameter called `name`, `null` when absent. */
export function readAddressParameter(
	address: string,
	name: string,
): string | null {
	for (const segment of addressBody(address).split("&")) {
		if (segmentName(segment) === name) {
			const equals = segment.indexOf("=");
			return equals === -1 ? "" : segment.slice(equals + 1);
		}
	}
	return null;
}

/**
 * Replace, append (value) or remove (`null`) parameters. Other segments are
 * kept verbatim and in order.
 */
export function writeAddressParameters(
	address: string,
	updates: Record<string, string | null>,
	prefix: "#" | "?",
): string {
	const segments = addressBody(address)
		.split("&")
		.filter((segment) => segment !== "");
	for (const [name, value] of Object.entries(updates)) {
		const encodedName = encodeURIComponent(name);
		let handled = false;
		for (let i = 0; i < segments.length;) {
			if (segmentName(segments[i]!) !== name) {
				i++;
			} else if (value !== null && !handled) {
				segments[i] = `${encodedName}=${value}`;
				handled = true;
				i++;
			} else {
				segments.splice(i, 1);
			}
		}
		if (value !== null && !handled) {
			segments.push(`${encodedName}=${value}`);
		}
	}
	return segments.length ? `${prefix}${segments.join("&")}` : "";
}

function finiteCoordinate(
	coordinate: number[] | undefined,
): [number, number] | null {
	const [x, y] = coordinate ?? [];
	return typeof x === "number" &&
		typeof y === "number" &&
		Number.isFinite(x) &&
		Number.isFinite(y)
		? [x, y]
		: null;
}

/** WGS84 degrees to view projection; `null` when not representable. */
export function lonLatToViewCoordinate(
	lon: number,
	lat: number,
	projection = DEFAULT_VIEW_PROJECTION,
): [number, number] | null {
	try {
		return finiteCoordinate(proj4(WGS84, projection, [lon, lat]));
	} catch {
		return null;
	}
}

/** View projection to WGS84 degrees; `null` when not representable. */
export function viewCoordinateToLonLat(
	coordinate: number[],
	projection = DEFAULT_VIEW_PROJECTION,
): {lon: number; lat: number} | null {
	try {
		const converted = finiteCoordinate(
			proj4(projection, WGS84, [coordinate[0]!, coordinate[1]!]),
		);
		return converted ? {lon: converted[0], lat: converted[1]} : null;
	} catch {
		return null;
	}
}

/** Layers a user can toggle in a layer switcher (not locked, not derived). */
export function isUserToggleableLayer(layer: LayerState): boolean {
	const meta = layer.metaData;
	return (
		!!(
			meta?.visibleInLayerSwitcher || meta?.visibleInExternalLayerSwitcher
		) &&
		!meta.lockedInLayerSwitcher &&
		!meta.visibleWhenLayerIds?.length
	);
}

export function trackedLayerIds(
	layers: Record<string, LayerState> | undefined,
	tracking: LayerTracking | undefined,
): string[] {
	if (!layers) {
		return [];
	}
	const ids = Object.keys(layers).filter(isRepresentableLayerId);
	if (Array.isArray(tracking)) {
		return ids.filter((id) => tracking.includes(id));
	}
	const predicate =
		tracking ??
		((_id: string, layer: LayerState) => isUserToggleableLayer(layer));
	return ids.filter((id) => predicate(id, layers[id]!));
}

/**
 * Visibility changes that make the tracked layers match `visibleIds`.
 * Unknown ids are ignored, untracked layers are never listed. Of several
 * listed base layers the first one wins and the others count as not listed.
 * Hides come first so that showing a base layer cannot be undone by a later
 * hide.
 */
export function planLayerVisibility(
	layers: Record<string, LayerState> | undefined,
	tracked: string[],
	visibleIds: string[],
): Array<{id: string; visible: boolean}> {
	const hide: Array<{id: string; visible: boolean}> = [];
	const show: Array<{id: string; visible: boolean}> = [];
	const isBaseLayer = (id: string) =>
		tracked.includes(id) && !!layers?.[id]?.metaData?.isBaseLayer;
	const firstBaseLayer = visibleIds.find(isBaseLayer);
	for (const id of tracked) {
		const desired =
			visibleIds.includes(id) &&
			(!isBaseLayer(id) || id === firstBaseLayer);
		const current = layers?.[id]?.options?.visible === true;
		if (desired !== current) {
			(desired ? show : hide).push({id, visible: desired});
		}
	}
	return [...hide, ...show];
}

export function visibleTrackedLayerIds(
	layers: Record<string, LayerState> | undefined,
	tracked: string[],
): string[] {
	return tracked.filter((id) => layers?.[id]?.options?.visible === true);
}

function sameSet(a: string[], b: string[]): boolean {
	return a.length === b.length && a.every((id) => b.includes(id));
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

type ViewSnapshot = ParsedView;
type AnyState = Record<string, unknown>;

function createWindowAdapter(location: "hash" | "search"): AddressAdapter {
	return {
		read: () =>
			location === "hash" ? window.location.hash : window.location.search,
		write(next) {
			const {pathname, search, hash} = window.location;
			const url =
				location === "hash"
					? `${pathname}${search}${next}`
					: `${pathname}${next}${hash}`;
			window.history.replaceState(window.history.state, "", url);
		},
	};
}

function getOlView(store: EnhancedStore, mapControllerName: string) {
	const controller = store.getController(mapControllerName) as
		MapController | undefined;
	return controller?.getMap()?.getView() ?? null;
}

function snapshotView(
	store: EnhancedStore,
	mapControllerName: string,
): ViewSnapshot | null {
	const view = getOlView(store, mapControllerName);
	const center = view?.getCenter();
	const zoom = view?.getZoom();
	if (!view || !center || zoom === undefined) {
		return null;
	}
	const lonLat = viewCoordinateToLonLat(
		center,
		view.getProjection().getCode(),
	);
	if (!lonLat) {
		return null;
	}
	return {
		zoom,
		...lonLat,
		rotation: ((view.getRotation() ?? 0) * 180) / Math.PI,
	};
}

/** A view from the address, in view projection coordinates and radians. */
type LinkedView = {center: [number, number]; zoom: number; rotation: number};

/** `null` when the place cannot be represented or the zoom is out of limits. */
function resolveLinkedView(
	parsed: ParsedView,
	projection: string,
	minZoom?: number,
	maxZoom?: number,
): LinkedView | null {
	const center = lonLatToViewCoordinate(parsed.lon, parsed.lat, projection);
	if (
		!center ||
		(minZoom !== undefined && parsed.zoom < minZoom) ||
		(maxZoom !== undefined && parsed.zoom > maxZoom)
	) {
		return null;
	}
	return {
		center,
		zoom: parsed.zoom,
		rotation: (parsed.rotation * Math.PI) / 180,
	};
}

/**
 * Keeps the map view and the visibility of layers in the page address so a
 * copied link reopens the same view. Opt-in: not part of the default plugins.
 *
 * @param options options
 * @returns plugin instance
 */
export default function createPlugin(
	options: Options = {},
): ViewPermalinkPlugin {
	const {
		mapControllerName = MAP,
		viewParameter = DEFAULT_VIEW_PARAMETER,
		layersParameter = DEFAULT_LAYERS_PARAMETER,
		location = "hash",
		trackedLayers,
		debounceMs = 250,
		followAddressChanges = true,
	} = options;
	const precision =
		Number.isInteger(options.precision) &&
		options.precision! >= 0 &&
		options.precision! <= 10
			? options.precision!
			: 5;
	const prefix = location === "hash" ? "#" : "?";

	const noop: ViewPermalinkPlugin = {destroy() {}};
	if (typeof window === "undefined") {
		return noop;
	}
	const adapter = options.adapter ?? createWindowAdapter(location);

	let destroyed = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	const cleanups: Array<() => void> = [];
	// Set in `afterInit` when the address names a usable view; applied in
	// `afterCreate`, once the hydration snapshot has been captured.
	let linkedView: LinkedView | null = null;

	// Parameter values last read from or written to the address (percent-decoded,
	// so a router's re-spelling is no change), so that our own writes and
	// unrelated address changes are never applied again.
	const seen: {view: string | null; layers: string | null} = {
		view: null,
		layers: null,
	};
	// Serialisations last observed in the state (change detection for writes).
	const last: {view: string | null; layers: string | null} = {
		view: null,
		layers: null,
	};

	const readParameter = (name: string | false, address: string) =>
		name === false ? null : readAddressParameter(address, name);
	const decoded = (raw: string | null) =>
		raw === null ? null : (decodeParameterValue(raw) ?? raw);

	function cancelPendingWrite() {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	}

	function applyLayers(store: EnhancedStore, ids: string[]) {
		const layers = store.getState()[mapControllerName] as
			{layers?: Record<string, LayerState>} | undefined;
		const tracked = trackedLayerIds(layers?.layers, trackedLayers);
		for (const {id, visible} of planLayerVisibility(
			layers?.layers,
			tracked,
			ids,
		)) {
			store.dispatch(
				setLayerVisibility(mapControllerName, id, visible) as never,
			);
		}
	}

	/** Without animation, and effective immediately: no render is needed. */
	function applyView(store: EnhancedStore, view: LinkedView) {
		// The state first, so that it is consistent right away ...
		store.dispatch(
			merge([mapControllerName, "view"], {
				zoom: view.zoom,
				center: view.center,
				rotation: view.rotation,
			}) as never,
		);
		// ... then the live view, which the state alone would leave untouched
		// when it already holds these values but the view has moved on.
		const olView = getOlView(store, mapControllerName);
		if (!olView) {
			return;
		}
		if (olView.getZoom() !== view.zoom) {
			olView.setZoom(view.zoom);
		}
		const center = olView.getCenter();
		if (
			!center ||
			center[0] !== view.center[0] ||
			center[1] !== view.center[1]
		) {
			olView.setCenter(view.center);
		}
		if (olView.getRotation() !== view.rotation) {
			olView.setRotation(view.rotation);
		}
	}

	function applyAddress(store: EnhancedStore) {
		if (destroyed) {
			return;
		}
		const address = adapter.read();
		const rawView = readParameter(viewParameter, address);
		const rawLayers = readParameter(layersParameter, address);
		const view = decoded(rawView);
		const layers = decoded(rawLayers);
		let applied = false;
		if (view !== null && view !== seen.view) {
			const parsed = parseViewParameter(decodeParameterValue(rawView!));
			const olView = getOlView(store, mapControllerName);
			const linked =
				parsed && olView
					? resolveLinkedView(
							parsed,
							olView.getProjection().getCode(),
							olView.getMinZoom(),
							olView.getMaxZoom(),
						)
					: null;
			if (linked) {
				applyView(store, linked);
				applied = true;
			}
		}
		if (layers !== null && layers !== seen.layers) {
			const ids = parseLayersParameter(rawLayers);
			if (ids) {
				applyLayers(store, ids);
				applied = true;
			}
		}
		seen.view = view;
		seen.layers = layers;
		if (applied) {
			// A write scheduled for the previous state must not replace the address
			// that was just followed, and the state now matches that address.
			cancelPendingWrite();
			const baseline = serialise(store);
			last.view = baseline.view;
			last.layers = baseline.layers;
		}
	}

	function serialise(store: EnhancedStore) {
		let view: string | null = null;
		if (viewParameter !== false) {
			const snapshot = snapshotView(store, mapControllerName);
			view = snapshot ? formatViewParameter(snapshot, precision) : null;
		}
		let layers: string | null = null;
		if (layersParameter !== false) {
			const mapState = store.getState()[mapControllerName] as
				{layers?: Record<string, LayerState>} | undefined;
			layers = formatLayersParameter(
				visibleTrackedLayerIds(
					mapState?.layers,
					trackedLayerIds(mapState?.layers, trackedLayers),
				),
			);
		}
		return {view, layers};
	}

	function flush(store: EnhancedStore) {
		timer = undefined;
		if (destroyed) {
			return;
		}
		const next = serialise(store);
		const viewChanged = next.view !== last.view;
		const layersChanged = next.layers !== last.layers;
		last.view = next.view;
		last.layers = next.layers;

		// A parameter needs writing when its state changed and the address does
		// not already say the same (e.g. because we just applied the address).
		// A layer list that cannot be represented (`null`) is left as it is.
		const address = adapter.read();
		let stale = false;
		if (viewParameter !== false && next.view !== null && viewChanged) {
			const current = readParameter(viewParameter, address);
			stale =
				current === null || decodeParameterValue(current) !== next.view;
		}
		const nextIds =
			next.layers === null ? null : parseLayersParameter(next.layers);
		if (layersParameter !== false && nextIds && layersChanged) {
			const current = readParameter(layersParameter, address);
			const currentIds =
				current === null ? null : parseLayersParameter(current);
			stale ||= !currentIds || !sameSet(currentIds, nextIds);
		}
		if (!stale) {
			return;
		}
		// One link carries the whole state, so write both parameters together.
		const updates: Record<string, string | null> = {};
		if (viewParameter !== false && next.view !== null) {
			updates[viewParameter] = next.view;
		}
		if (layersParameter !== false && nextIds && next.layers !== null) {
			updates[layersParameter] = next.layers;
		}
		const written = writeAddressParameters(address, updates, prefix);
		// Record what is being written first: an adapter may notify us
		// synchronously, and that address change is our own.
		seen.view = decoded(readParameter(viewParameter, written));
		seen.layers = decoded(readParameter(layersParameter, written));
		adapter.write(written);
	}

	function schedule(store: EnhancedStore) {
		if (destroyed) {
			return;
		}
		cancelPendingWrite();
		timer = setTimeout(() => flush(store), debounceMs);
	}

	return {
		afterInit(context: MapsightUiContext) {
			if (viewParameter === false) {
				return;
			}
			const rawView = readParameter(viewParameter, adapter.read());
			const parsed =
				rawView === null
					? null
					: parseViewParameter(decodeParameterValue(rawView));
			if (!parsed) {
				return;
			}
			// Read-only: the initial state, and with it the hydration snapshot
			// taken from it, stays as configured. The view is applied in
			// `afterCreate`.
			const mapState = context.initialState?.[
				mapControllerName as never
			] as {view?: Record<string, unknown>} | undefined;
			const configured = mapState?.view ?? {};
			linkedView = resolveLinkedView(
				parsed,
				typeof configured.projection === "string"
					? configured.projection
					: DEFAULT_VIEW_PROJECTION,
				typeof configured.minZoom === "number"
					? configured.minZoom
					: undefined,
				typeof configured.maxZoom === "number"
					? configured.maxZoom
					: undefined,
			);
			if (linkedView) {
				context.initialViewFromAddress = true;
			}
		},

		afterCreate({store}: MapsightUiContext) {
			if (!store || destroyed) {
				return;
			}
			const address = adapter.read();
			seen.view = decoded(readParameter(viewParameter, address));
			seen.layers = decoded(readParameter(layersParameter, address));

			if (layersParameter !== false && seen.layers !== null) {
				const ids = parseLayersParameter(
					readParameter(layersParameter, address),
				);
				if (ids) {
					applyLayers(store, ids);
				}
			}
			if (linkedView) {
				applyView(store, linkedView);
				linkedView = null;
			}

			const baseline = serialise(store);
			last.view = baseline.view;
			last.layers = baseline.layers;

			if (viewParameter !== false) {
				cleanups.push(
					observeState(
						store,
						(state) =>
							(state as AnyState)[mapControllerName]
								? (
										(state as AnyState)[
											mapControllerName
										] as AnyState
									).view
								: undefined,
						() => schedule(store),
					),
				);
			}
			if (layersParameter !== false) {
				let layersRef: unknown;
				let visibleKey: string | null = "";
				cleanups.push(
					observeState(
						store,
						(state) => {
							const layers = (
								(state as AnyState)[mapControllerName] as
									| {layers?: Record<string, LayerState>}
									| undefined
							)?.layers;
							if (layers !== layersRef) {
								layersRef = layers;
								visibleKey = formatLayersParameter(
									visibleTrackedLayerIds(
										layers,
										trackedLayerIds(layers, trackedLayers),
									),
								);
							}
							return visibleKey;
						},
						() => schedule(store),
					),
				);
			}

			if (followAddressChanges) {
				const onAddressChange = () => applyAddress(store);
				window.addEventListener("hashchange", onAddressChange);
				window.addEventListener("popstate", onAddressChange);
				cleanups.push(() => {
					window.removeEventListener("hashchange", onAddressChange);
					window.removeEventListener("popstate", onAddressChange);
				});
			}
		},

		destroy() {
			destroyed = true;
			cancelPendingWrite();
			for (const cleanup of cleanups.splice(0)) {
				cleanup();
			}
		},
	};
}
