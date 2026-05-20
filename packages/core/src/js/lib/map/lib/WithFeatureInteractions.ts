import type Feature from "ol/Feature";

import forEach from "lodash/forEach";
import type {MapBrowserEvent} from "ol";
import {batchActions} from "redux-batched-actions";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

import {
	deselect,
	select,
	selectExclusively,
} from "@/lib/feature-selections/actions";
import type {FeatureSelectionsState} from "@/lib/feature-selections/selectors";
import {getOlFeatureId} from "@/lib/helpers/ol";
import {typeSafeObjectKeys} from "@/lib/helpers/types";
import type {MapController} from "@/lib/map/controller";
import type {InteractionName, MapState} from "@/lib/map/types";
import type {Action} from "@/types";

import {setMapCursor} from "../actions";
import {makeLayerSelectionSelector} from "../selectors";
import WithMap from "./WithMap";
import {getIdForLayer} from "./tagLayer";

type MapEventEmitter = Pick<
	MapController,
	"getMap" | "getStore" | "getState" | "dispatch" | "getName"
>;

export type FeatureInteractionOptions = {
	cursor?: string;
	hitTolerance?: number;
	selectExclusively?: boolean;
	deselectUncontrolled?: null | Array<string>;
};

export type FeatureInteractionMouseButtons = {
	main?: boolean | FeatureInteractionOptions;
	auxiliary?: boolean | FeatureInteractionOptions;
	secondary?: boolean | FeatureInteractionOptions;
	third?: boolean | FeatureInteractionOptions;
	fourth?: boolean | FeatureInteractionOptions;
	fifth?: boolean | FeatureInteractionOptions;
};

export type FeatureInteractionOverrides = {
	shift?: boolean | FeatureInteractionOptions;
	alt?: boolean | FeatureInteractionOptions;
	ctrl?: boolean | FeatureInteractionOptions;
	meta?: boolean | FeatureInteractionOptions;
};

type AnyFeatureInteractionOptions = FeatureInteractionOptions &
	FeatureInteractionMouseButtons &
	FeatureInteractionOverrides;

export type FeatureInteraction = {
	selection: InteractionName;
	options: AnyFeatureInteractionOptions;
};

export type FeatureInteractions = Record<InteractionName, FeatureInteraction>;

const FEATURE_PROPERTY_NAME_SELECTABLE = "selectable";

// TODO: Keep default?
const defaultFeatureSelectionsControllerName = "featureSelections";

// TODO: Support button_s_?
// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const MOUSE_EVENT_BUTTON_MAP = {
	0: "main",
	1: "auxiliary",
	2: "secondary",
	3: "third",
	4: "fourth",
	5: "fifth",
} as const;

// TODO: Support combinations like 'shift+ctrl' etc.?
// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
const MOUSE_EVENT_MODIFIER_MAP = {
	shift: "shiftKey",
	alt: "altKey",
	ctrl: "ctrlKey",
	meta: "metaKey",
} as const;

// TODO: Keep these defaults?
const defaultFeatureInteractions = {
	mouseover: {
		selection: "mouseover",
		options: {
			// mouse event button
			main: true,
			auxiliary: false,
			secondary: false,
			fourth: false,
			fifth: false,

			// options
			cursor: "pointer",
			deselectUncontrolled: null,
			hitTolerance: 5,
		},
	},

	mousedown: {
		selection: "mousedown",
		options: {
			// mouse event button
			main: true,
			auxiliary: false,
			secondary: false,
			fourth: false,
			fifth: false,

			// options
			cursor: undefined,
			deselectUncontrolled: null,
			hitTolerance: 5,

			// override per meta key (shift, alt, ctrl, meta)
			shift: {
				selectExclusively: false,
			},
		},
	},

	touch: {
		selection: "touch",
		options: {
			// options
			cursor: undefined,
			deselectUncontrolled: null,
			hitTolerance: 5,
		},
	},
} satisfies FeatureInteractions;

function getSelectionId(
	layerId: string,
	interactionName: InteractionName,
	state: MapState,
) {
	return makeLayerSelectionSelector(layerId, interactionName)(state);
}

/**
 * Override options based on the (mouse) event
 *
 * @param baseOptions base options
 * @param event event object
 *
 * @returns overwritten options
 */
function overrideOptionsForEvent(
	baseOptions: AnyFeatureInteractionOptions,
	event: MouseEvent | TouchEvent | KeyboardEvent,
) {
	let options = baseOptions;

	if ("button" in event) {
		const button =
			MOUSE_EVENT_BUTTON_MAP[
				event.button as keyof typeof MOUSE_EVENT_BUTTON_MAP
			];
		const optionsForButton = options[button];
		if (optionsForButton === false) {
			return false;
		}

		if (typeof optionsForButton === "object") {
			options = {...options, ...optionsForButton};
		}
	}

	for (const modifierKey of typeSafeObjectKeys(MOUSE_EVENT_MODIFIER_MAP)) {
		const eventName = MOUSE_EVENT_MODIFIER_MAP[modifierKey];
		if (event[eventName]) {
			const optionsForModifier = options[modifierKey];
			if (optionsForModifier === false) {
				return false;
			}

			if (typeof optionsForModifier === "object") {
				options = {...options, ...(optionsForModifier || {})};
			}
		}
	}

	return options;
}

type FeatureInteractionEventCache = {
	cursor: string | null;
	selections: Record<string, string>;
};

/**
 * Handles a openlayers selection interaction map event (mouse or touch), dispatching actions for selection/deselection and setting
 * the map cursor.
 *
 * @internal
 * @param mapController map controller object
 * @param featureSelectionsControllerName name of the featureSelections controller
 * @param interactionName name of the interaction
 * @param [options] options object
 * @param [options.cursor=null] set cursor of map on selection, for values see https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
 * @param [options.selectExclusively=true] set to false to keep uncontrolled selections
 * @param [options.removeUncontrolled=false] set to true to remove selections when they were not done through this interaction handler
 * @param [options.hitTolerance=5] pixel tolerance when determining hit features
 * @param cache previous cache object controlled by parent
 * @param event openlayers event object
 *
 * @returns {FeatureInteractionEventCache|null} new cache object to be kept by parent
 */
function handleEvent(
	mapController: MapEventEmitter,
	featureSelectionsControllerName: string,
	interactionName: InteractionName,
	options: FeatureInteractionOptions = {},
	cache: FeatureInteractionEventCache | null = null,
	event: MapBrowserEvent,
): FeatureInteractionEventCache | null {
	if (!interactionName) {
		return cache;
	}

	// TODO: Move code accessing ._map to the controller?
	const map = mapController.getMap();
	if (!map) {
		return cache;
	}

	// TODO: Allow interaction during animation for some event types?
	const view = map.getView();
	if (!view || view.getAnimating() || view.getInteracting()) {
		return cache;
	}

	if (event.originalEvent) {
		const originalEvent = event.originalEvent;
		const appliedOptions = overrideOptionsForEvent(options, originalEvent);

		if (appliedOptions === false) {
			return cache;
		}
	}

	const selectionsState = mapController.getStore()?.getState()[
		featureSelectionsControllerName
	] as FeatureSelectionsState;
	const state = mapController.getState();

	const newSelections: Record<string, string> = {};

	let newCursor: string | null = null;

	let hasNew = false;
	map.forEachFeatureAtPixel(
		event.pixel,
		(feature, layer) => {
			if (!feature || !layer) {
				return;
			}

			if (feature.get(FEATURE_PROPERTY_NAME_SELECTABLE) === false) {
				return;
			}

			const layerId = getIdForLayer(layer);
			if (!layerId) {
				return;
			}

			const selectionId = getSelectionId(layerId, interactionName, state);
			if (!selectionId || !selectionsState[selectionId]) {
				return;
			}

			// Do not select if we already have a feature selected for the selection id
			// NOTE: This assumes only one (the first) may be selected
			if (selectionId in newSelections) {
				return;
			}

			let featureId: string | undefined;
			// For the case of vector tiles we cannot use the feature id that gets returned by openlayers' feature.getId()
			// but we need to use the id in the feature properties (if present) instead which will be shared by all render
			// features in all tiles representing the same "real" feature. This requires the vector tile features to provide
			// such an id in the properties.
			if (
				typeof layer === "object" &&
				"getType" in layer &&
				typeof layer.getType === "function" &&
				layer.getType() === "VECTOR_TILE"
			) {
				featureId = feature.getProperties().id;
			} else {
				featureId = getOlFeatureId(feature as Feature);
			}

			if (featureId === undefined) {
				return;
			}

			hasNew = true;
			newSelections[selectionId] = featureId;
		},
		{hitTolerance: options.hitTolerance},
	);

	const actions: Array<Action> = [];

	let hasAdded = false; // Keeping an eye on added selections to check later if we need to dispatch a cursor action
	if (hasNew) {
		const selectAction =
			options.selectExclusively === false ? select : selectExclusively;
		forEach(newSelections, (f, s) => {
			// Determine if the feature selection is new by comparing with previous selection in cache and state
			// Only one of those must miss the feature selection to fulfill this condition!
			const shouldBeAdded =
				// using cache should be faster than searching through the state so we try that first:
				!cache ||
				cache.selections[s] !== f ||
				// but to be sure we need to check state as well as the selections might have changed from outside this handler
				!selectionsState[s]?.features ||
				!selectionsState[s]?.features.includes(f);

			if (shouldBeAdded) {
				hasAdded = true;
				actions.push(
					selectAction(featureSelectionsControllerName, s, f),
				);
			}
		});
	}

	// hasAdded bedeutet bei selectExclusively, dass bereits alle anderen entfernt werden (wegen ACTION_SET)
	// → dass hier nur Aufrufen wenn (das letzte) Feature entfernt wird
	if (cache && options.selectExclusively !== false && !hasAdded) {
		forEach(cache.selections, (f, s) => {
			// Determine if the cached feature selection is invalid by comparing with new selection
			const shouldBeRemoved = newSelections[s] !== f;
			if (shouldBeRemoved) {
				actions.push(deselect(featureSelectionsControllerName, s, f));
			}
		});
	}

	// auch hier: kein remove wenn selectExclusivly schon alles unnötige entfernt hat
	if (
		options.deselectUncontrolled &&
		(options.selectExclusively === false || !hasAdded)
	) {
		options.deselectUncontrolled.forEach((s) => {
			const featureIds =
				(selectionsState[s] && selectionsState[s]?.features) || [];
			featureIds
				.filter(
					(f) =>
						newSelections[s] !== f &&
						(!cache || cache.selections[s] !== f),
				)
				.forEach((f) =>
					actions.push(
						deselect(featureSelectionsControllerName, s, f),
					),
				);
		});
	}

	if (!actions.length) {
		return cache;
	}

	let cursorAction: Action | null = null;
	if (options.cursor) {
		if (hasAdded) {
			newCursor = options.cursor;
		}

		if (!cache || newCursor !== cache.cursor) {
			cursorAction = setMapCursor(mapController.getName(), newCursor);
		}
	}

	// TODO: Check and document why we delay using setTimeout!
	setTimeout(function () {
		if (cursorAction) {
			mapController.dispatch(cursorAction);
		}

		if (actions.length === 1) {
			mapController.dispatch(ensureNonNullable(actions[0]));
		} else {
			mapController.dispatch(batchActions(actions));
		}
	}, 10);

	return {selections: newSelections, cursor: newCursor};
}

function createHandler(
	mapController: MapEventEmitter,
	featureSelectionsControllerName: string,
	options: FeatureInteraction,
) {
	if (!options) {
		return null;
	}

	let cache: FeatureInteractionEventCache | null = null;
	return function interactionHandler(event: MapBrowserEvent) {
		cache = handleEvent(
			mapController,
			featureSelectionsControllerName,
			options.selection,
			options.options,
			cache,
			event,
		);
	};
}

export default class WithFeatureInteractions extends WithMap {
	override init() {
		const map = this.getMap();
		if (!map) {
			console.error(
				"Could not initialize WithFeatureInteractions: no map",
			);
			return;
		}

		const handlers: Record<
			InteractionName,
			ReturnType<typeof createHandler>
		> = {
			mouseover: null,
			mousedown: null,
			touch: null,
		};

		this.getAndObserveUncontrolled(
			(state) => ({
				featureInteractions: state.featureInteractions as Record<
					InteractionName,
					FeatureInteraction
				>,
				featureSelectionsControllerName:
					state.featureSelectionsControllerName as string,
			}),
			(state) => {
				const {
					featureInteractions = defaultFeatureInteractions,
					featureSelectionsControllerName = defaultFeatureSelectionsControllerName,
				} = state || {};

				Object.assign(handlers, {
					mouseover: createHandler(
						this,
						featureSelectionsControllerName,
						featureInteractions.mouseover,
					),
					mousedown: createHandler(
						this,
						featureSelectionsControllerName,
						featureInteractions.mousedown,
					),
					touch: createHandler(
						this,
						featureSelectionsControllerName,
						featureInteractions.touch,
					),
				});
			},
		);

		map.on("pointermove", function onPointerMove(e) {
			if (!handlers.mouseover || e.dragging) {
				return;
			}

			// pointerType may not be available in older browsers so we assume mouse if pointerType is not available
			if (
				!("pointerType" in e.originalEvent) ||
				e.originalEvent.pointerType === "mouse"
			) {
				handlers.mouseover(e);
			}
		});

		map.on("click", function onClick(e) {
			if (
				handlers.touch &&
				"pointerType" in e.originalEvent &&
				e.originalEvent.pointerType === "touch"
			) {
				handlers.touch(e);
			} else if (handlers.mousedown) {
				handlers.mousedown(e);
			}
		});
	}
}
