import {type Key, useCallback, useEffect, useRef, useState} from "react";
import {OverlayContainer, OverlayProvider} from "react-aria";
import {
	Button,
	Menu,
	MenuItem,
	MenuTrigger,
	Popover,
	SubmenuTrigger,
} from "react-aria-components";
import {useDispatch, useStore} from "react-redux";

import type OlMap from "ol/Map";
import type {Coordinate} from "ol/coordinate";

import type {EnhancedStore} from "@mapsight/core/types";

import {MAP} from "../../config/constants/controllers";
import {announceStatus} from "../../helpers/announce-status";
import {translate} from "../../helpers/i18n";
import {
	DEFAULT_MARKED_POINT_PLUGIN,
	createMarkedPointFeature,
	eventPointIsOverMap,
	eventTargetIsInMap,
	eventTargetIsInMapMenu,
	formatCoordinateSpellings,
	isMapContextMenuKeyboardEvent,
	lonLatFromMapCoordinate,
	setMarkedPoint,
	shouldOpenMapContextMenu,
} from "../../plugins/browser/marked-point";
import {fetchNearestAddress} from "../../plugins/browser/nearest-address";
import {resolvePlaceActions} from "../place-actions/resolve-place-actions";
import type {
	PlaceActionsConfig,
	ResolvedNavTarget,
} from "../place-actions/types";

const LONG_PRESS_MS = 500;
const MENU_OFFSET_X = 16;
const MENU_OFFSET_Y = 12;

type MapPoint = {
	x: number;
	y: number;
	lon: number;
	lat: number;
	showCrosshair: boolean;
};

export type MapPointContextMenuProps = {
	pluginName?: string;
	mapControllerName?: string;
	navigation?: PlaceActionsConfig["navigation"];
	/** Same-origin geo-search `nearest.php`. When set, the pin drops first, then the label updates. */
	nearestUrl?: string;
};

function getOlMap(
	store: EnhancedStore,
	mapControllerName: string,
): OlMap | null {
	const controller = store.getController(mapControllerName) as
		{getMap?: () => OlMap | null} | undefined;
	return controller?.getMap?.() ?? null;
}

function lonLatFromEvent(
	map: OlMap,
	event: MouseEvent | PointerEvent,
): {lon: number; lat: number} | null {
	const coordinate = map.getEventCoordinate(event) as Coordinate | undefined;
	if (!coordinate) {
		return null;
	}
	return lonLatFromMapCoordinate(coordinate);
}

function clientPointFromCoordinate(
	map: OlMap,
	coordinate: Coordinate,
): {x: number; y: number} | null {
	const pixel = map.getPixelFromCoordinate(coordinate);
	const target = map.getTargetElement();
	const x = pixel?.[0];
	const y = pixel?.[1];
	if (x == null || y == null || !target) {
		return null;
	}
	const rect = target.getBoundingClientRect();
	return {x: rect.left + x, y: rect.top + y};
}

function navTargetsForPoint(
	lon: number,
	lat: number,
	navigation: PlaceActionsConfig["navigation"] | undefined,
): ResolvedNavTarget[] {
	const actions = resolvePlaceActions(createMarkedPointFeature(lon, lat), {
		permalink: () => null,
		showOnMap: false,
		copyCoords: false,
		navigation: {
			fromGeometry: true,
			...navigation,
		},
	});
	const navigate = actions.find((action) => action.kind === "navigate");
	return navigate?.targets ?? [];
}

export function originNavHref(
	targetId: string,
	lon: number,
	lat: number,
): string | null {
	if (targetId === "google") {
		return `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}`;
	}
	if (targetId === "apple") {
		return `https://maps.apple.com/?saddr=${lat},${lon}`;
	}
	return null;
}

function fromHereTargets(
	lon: number,
	lat: number,
	targets: ResolvedNavTarget[],
): ResolvedNavTarget[] {
	const next: ResolvedNavTarget[] = [];
	for (const target of targets) {
		const href = originNavHref(target.id, lon, lat);
		if (!href) {
			continue;
		}
		next.push({...target, href});
	}
	return next;
}

async function copyCoordinates(lat: number, lon: number): Promise<void> {
	await window.navigator.clipboard.writeText(
		formatCoordinateSpellings(lat, lon).text,
	);
	announceStatus(translate("ui.map-point.copied"));
}

export default function MapPointContextMenu({
	pluginName = DEFAULT_MARKED_POINT_PLUGIN,
	mapControllerName = MAP,
	navigation,
	nearestUrl,
}: MapPointContextMenuProps) {
	const store = useStore() as EnhancedStore;
	const dispatch = useDispatch();
	const [open, setOpen] = useState(false);
	const [point, setPoint] = useState<MapPoint | null>(null);
	const [menuKey, setMenuKey] = useState(0);
	const pointerDownRef = useRef<{x: number; y: number} | null>(null);
	const lastPointerButtonRef = useRef(0);
	const relocatingRef = useRef(false);
	const lastPointerRef = useRef<MapPoint | null>(null);
	const longPressTimerRef = useRef<number | null>(null);
	const geocodeAbortRef = useRef<AbortController | null>(null);
	const dropGenerationRef = useRef(0);

	const closeMenu = useCallback(() => {
		setOpen(false);
		setPoint(null);
	}, []);

	const dropPin = useCallback(
		(next: MapPoint) => {
			dispatch(
				setMarkedPoint({
					pluginName,
					lon: next.lon,
					lat: next.lat,
				}) as never,
			);
			announceStatus(translate("ui.map-point.marked"));

			geocodeAbortRef.current?.abort();
			if (!nearestUrl) {
				return;
			}
			const generation = ++dropGenerationRef.current;
			const abort = new AbortController();
			geocodeAbortRef.current = abort;
			void fetchNearestAddress(
				nearestUrl,
				next.lat,
				next.lon,
				abort.signal,
			)
				.then((address) => {
					if (!address || generation !== dropGenerationRef.current) {
						return;
					}
					dispatch(
						setMarkedPoint({
							pluginName,
							lon: next.lon,
							lat: next.lat,
							featureName: address.name,
							listInformation: address.listInformation,
						}) as never,
					);
					announceStatus(
						translate("ui.map-point.geocoded").replace(
							"{name}",
							address.name,
						),
					);
				})
				.catch(() => {
					// Keep the immediate pin; nearest is optional.
				});
		},
		[dispatch, nearestUrl, pluginName],
	);

	const openAt = useCallback(
		(next: MapPoint) => {
			lastPointerRef.current = next;
			relocatingRef.current = true;
			setMenuKey((key) => key + 1);
			setPoint(next);
			setOpen(true);
			dropPin(next);
		},
		[dropPin],
	);

	const clearLongPress = useCallback(() => {
		if (longPressTimerRef.current != null) {
			window.clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
	}, []);

	useEffect(() => {
		const rememberPointer = (event: PointerEvent) => {
			const map = getOlMap(store, mapControllerName);
			if (
				!map ||
				!eventTargetIsInMap(event.target, map.getTargetElement())
			) {
				return;
			}
			const lonLat = lonLatFromEvent(map, event);
			if (!lonLat) {
				return;
			}
			lastPointerRef.current = {
				x: event.clientX,
				y: event.clientY,
				lon: lonLat.lon,
				lat: lonLat.lat,
				showCrosshair: false,
			};
		};

		const onPointerDown = (event: PointerEvent) => {
			lastPointerButtonRef.current = event.button;
			const map = getOlMap(store, mapControllerName);
			if (
				!map ||
				!eventTargetIsInMap(event.target, map.getTargetElement())
			) {
				pointerDownRef.current = null;
				return;
			}
			pointerDownRef.current = {x: event.clientX, y: event.clientY};
			rememberPointer(event);
			clearLongPress();
			if (event.pointerType !== "touch" && event.pointerType !== "pen") {
				return;
			}
			const start = {x: event.clientX, y: event.clientY};
			longPressTimerRef.current = window.setTimeout(() => {
				const current = lastPointerRef.current;
				if (
					!current ||
					!shouldOpenMapContextMenu(start, {
						x: current.x,
						y: current.y,
					})
				) {
					return;
				}
				openAt({...current, showCrosshair: false});
			}, LONG_PRESS_MS);
		};

		const onPointerMove = (event: PointerEvent) => {
			rememberPointer(event);
			if (
				pointerDownRef.current &&
				!shouldOpenMapContextMenu(pointerDownRef.current, {
					x: event.clientX,
					y: event.clientY,
				})
			) {
				clearLongPress();
			}
		};

		const onContextMenu = (event: MouseEvent) => {
			const map = getOlMap(store, mapControllerName);
			const mapTarget = map?.getTargetElement() ?? null;
			if (!map || !mapTarget) {
				return;
			}
			if (eventTargetIsInMapMenu(event.target)) {
				return;
			}
			const overMap =
				eventTargetIsInMap(event.target, mapTarget) ||
				eventPointIsOverMap(
					{x: event.clientX, y: event.clientY},
					mapTarget,
				);
			if (!overMap) {
				return;
			}
			if (
				eventTargetIsInMap(event.target, mapTarget) &&
				!shouldOpenMapContextMenu(pointerDownRef.current, {
					x: event.clientX,
					y: event.clientY,
				})
			) {
				return;
			}
			const lonLat = lonLatFromEvent(map, event);
			if (!lonLat) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			clearLongPress();
			openAt({
				x: event.clientX,
				y: event.clientY,
				lon: lonLat.lon,
				lat: lonLat.lat,
				showCrosshair: false,
			});
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (!isMapContextMenuKeyboardEvent(event)) {
				return;
			}
			const map = getOlMap(store, mapControllerName);
			const mapTarget = map?.getTargetElement() ?? null;
			if (
				!map ||
				!mapTarget ||
				!eventTargetIsInMap(document.activeElement, mapTarget)
			) {
				return;
			}
			event.preventDefault();
			const last = lastPointerRef.current;
			if (last) {
				openAt({...last, showCrosshair: true});
				return;
			}
			const center = map.getView().getCenter();
			if (!center) {
				return;
			}
			const lonLat = lonLatFromMapCoordinate(center);
			const client = clientPointFromCoordinate(map, center);
			if (!lonLat || !client) {
				return;
			}
			openAt({
				...client,
				lon: lonLat.lon,
				lat: lonLat.lat,
				showCrosshair: true,
			});
		};

		document.addEventListener("pointerdown", onPointerDown, true);
		document.addEventListener("pointermove", onPointerMove, true);
		document.addEventListener("pointerup", clearLongPress, true);
		document.addEventListener("pointercancel", clearLongPress, true);
		document.addEventListener("contextmenu", onContextMenu, true);
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("pointermove", onPointerMove, true);
			document.removeEventListener("pointerup", clearLongPress, true);
			document.removeEventListener("pointercancel", clearLongPress, true);
			document.removeEventListener("contextmenu", onContextMenu, true);
			document.removeEventListener("keydown", onKeyDown);
			clearLongPress();
			geocodeAbortRef.current?.abort();
		};
	}, [clearLongPress, mapControllerName, openAt, store]);

	useEffect(() => {
		relocatingRef.current = false;
	}, [menuKey, point]);

	const onOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) {
				if (relocatingRef.current) {
					return;
				}
				closeMenu();
				return;
			}
			setOpen(true);
		},
		[closeMenu],
	);

	const onAction = useCallback(
		(key: Key) => {
			if (!point) {
				return;
			}
			if (key === "copy-coords") {
				void copyCoordinates(point.lat, point.lon);
			}
		},
		[point],
	);

	if (!point) {
		return null;
	}

	const toTargets = navTargetsForPoint(point.lon, point.lat, navigation);
	const fromTargets = fromHereTargets(point.lon, point.lat, toTargets);

	return (
		<OverlayProvider>
			<OverlayContainer>
				{point.showCrosshair ? (
					<div
						className="ms3-map-point-menu__crosshair"
						style={{left: point.x, top: point.y}}
						aria-hidden="true"
					/>
				) : null}
				<MenuTrigger
					key={menuKey}
					isOpen={open}
					onOpenChange={onOpenChange}
				>
					<Button
						className="ms3-map-point-menu__anchor"
						style={{
							left: point.x + MENU_OFFSET_X,
							top: point.y + MENU_OFFSET_Y,
						}}
						aria-label={translate("ui.map-point.menu")}
					/>
					<Popover
						placement="bottom start"
						offset={12}
						className="ms3-map-point-menu__popover"
						shouldCloseOnInteractOutside={() =>
							lastPointerButtonRef.current !== 2
						}
					>
						<Menu
							aria-label={translate("ui.map-point.menu")}
							className="ms3-map-point-menu"
							onAction={onAction}
						>
							<MenuItem
								id="copy-coords"
								className="ms3-map-point-menu__item"
							>
								{translate("ui.map-point.copy-coords")}
							</MenuItem>
							{fromTargets.length > 0 ? (
								<SubmenuTrigger>
									<MenuItem
										id="from-here"
										className="ms3-map-point-menu__item"
									>
										{translate("ui.map-point.from-here")}
									</MenuItem>
									<Popover className="ms3-map-point-menu__popover">
										<Menu
											aria-label={translate(
												"ui.map-point.from-here",
											)}
											className="ms3-map-point-menu"
										>
											{fromTargets.map((target) => (
												<MenuItem
													key={target.id}
													id={`from:${target.id}`}
													href={target.href}
													target="_blank"
													rel="noreferrer"
													className="ms3-map-point-menu__item"
												>
													{target.label}
												</MenuItem>
											))}
										</Menu>
									</Popover>
								</SubmenuTrigger>
							) : null}
							{toTargets.length > 0 ? (
								<SubmenuTrigger>
									<MenuItem
										id="to-here"
										className="ms3-map-point-menu__item"
									>
										{translate("ui.map-point.to-here")}
									</MenuItem>
									<Popover className="ms3-map-point-menu__popover">
										<Menu
											aria-label={translate(
												"ui.map-point.to-here",
											)}
											className="ms3-map-point-menu"
										>
											{toTargets.map((target) => (
												<MenuItem
													key={target.id}
													id={`to:${target.id}`}
													href={target.href}
													target="_blank"
													rel="noreferrer"
													className="ms3-map-point-menu__item"
												>
													{target.label}
												</MenuItem>
											))}
										</Menu>
									</Popover>
								</SubmenuTrigger>
							) : null}
						</Menu>
					</Popover>
				</MenuTrigger>
			</OverlayContainer>
		</OverlayProvider>
	);
}
