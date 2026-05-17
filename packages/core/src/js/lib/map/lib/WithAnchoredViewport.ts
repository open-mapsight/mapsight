import ViewProperty from "ol/ViewProperty";

import {async, controlled} from "../../base/actions";
import {UPDATE_SIZE, setMapSizeAfterUpdate} from "../actions";
import WithMap from "./WithMap";

export type ViewChangeDirection = "left" | "right" | "above" | "below";
export type ViewportAnchor = "left" | "right" | "top" | "bottom";

function getAnchorForDirection(
	direction: ViewChangeDirection,
): ViewportAnchor | null {
	switch (direction) {
		case "left":
			return "right";
		case "right":
			return "left";
		case "above":
			return "bottom";
		case "below":
			return "top";
		default:
			return null;
	}
}

function movePoint(
	[x, y]: [number, number],
	dX = 0,
	dY = 0,
	from: ViewChangeDirection | null = null,
	to: ViewChangeDirection | null = null,
) {
	if (from) {
		x =
			from === "left" && to !== "right"
				? x + dX
				: from === "right" && to !== "left"
					? x - dX
					: x;
		y =
			from === "above" && to !== "below"
				? y + dY
				: from === "below" && to !== "above"
					? y - dY
					: y;
	}

	if (to && from !== to) {
		x =
			to === "left" && from !== "right"
				? x + dX
				: to === "right" && from !== "left"
					? x - dX
					: x;
		y =
			to === "above" && from !== "below"
				? y + dY
				: to === "below" && from !== "above"
					? y - dY
					: y;
	}

	return [x, y];
}

export default class WithAnchoredViewport extends WithMap {
	override init() {
		const map = this.getMap();
		if (!map) {
			console.error("Cannot initialize WithAnchoredViewport without map");
			return;
		}

		const reCenterMap = (
			oldSize: [number, number],
			size: [number, number],
			from: ViewChangeDirection | null = null,
			to: ViewChangeDirection | null = null,
		) => {
			const dX = (oldSize[0] - size[0]) / 2;
			const dY = (oldSize[1] - size[1]) / 2;
			const xChanged = Math.abs(dX) > 1;
			const yChanged = Math.abs(dY) > 1;

			// if the center has not actually moved at least one pixel we are done
			if (xChanged || yChanged) {
				const newCenter = map.getCoordinateFromPixel(
					movePoint(
						[oldSize[0] / 2, oldSize[1] / 2],
						dX,
						dY,
						from,
						to,
					),
				);

				if (newCenter) {
					const view = map.getView();
					const oldCenter = view.getCenter();

					// not using setCenter because that cancels animations
					// TODO: this still is not ideal as animations are NOT re-centered
					//            making the center jump in the next animation frame
					//            - maybe we can re-center the active/pending animations?
					view.set(
						ViewProperty.CENTER,
						oldCenter
							? [
									// only change the coordinate values (x/y) that changed significantly
									xChanged ? newCenter[0] : oldCenter[0],
									yChanged ? newCenter[1] : oldCenter[1],
								]
							: newCenter,
					);
				}
			}
		};

		const updateMapSize = (
			stateSize: [number, number] | undefined,
			from: ViewChangeDirection | null = null,
			to: ViewChangeDirection | null = null,
			reCenter = false,
		) => {
			const oldSize = map.getSize();
			const targetElement = map.getTargetElement();

			if (targetElement) {
				const size = [
					targetElement.offsetWidth,
					targetElement.offsetHeight,
				] as [number, number];

				// has container size changed compared to canvas?
				// => update canvas size and recenter if requested
				if (
					!oldSize ||
					size[0] !== oldSize[0] ||
					size[1] !== oldSize[1]
				) {
					map.setSize(size);

					if (reCenter && oldSize) {
						reCenterMap(
							oldSize as [number, number],
							size,
							from,
							to,
						);
					}
				}

				// has container size changed to last state? => update state
				if (
					!stateSize ||
					size[0] !== stateSize[0] ||
					size[1] !== stateSize[1]
				) {
					this.dispatch(
						async(
							controlled(
								setMapSizeAfterUpdate(this.getName(), size),
							),
						),
					);
				}
			}
		};

		this.registerReducer(
			function reduceWithAnchoredViewport(state, action) {
				if (action.type === UPDATE_SIZE) {
					const viewportAnchor =
						getAnchorForDirection(action.from) ||
						getAnchorForDirection(action.to);
					if (
						viewportAnchor &&
						viewportAnchor !== state.viewportAnchor
					) {
						state = {
							...state,
							viewportAnchor: viewportAnchor,
						};
					}
					state = {
						...state,
						updateSizePending: true,
					};

					updateMapSize(
						state.size,
						action.from,
						action.to,
						action.reCenter,
					);
				}

				return state;
			},
		);
	}
}
