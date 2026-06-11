import type Feature from "ol/Feature";

import forEach from "lodash/forEach";
import isEqual from "lodash/isEqual";
import type {MapBrowserEvent} from "ol";
import {batchActions} from "redux-batched-actions";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

import {quiet} from "@/lib/base/actions";
import {
	deselect,
	select,
	selectExclusively,
} from "@/lib/feature-selections/actions";
import type {FeatureSelectionsState} from "@/lib/feature-selections/selectors";
import {getOlFeatureId} from "@/lib/helpers/ol";
import {typeSafeObjectKeys} from "@/lib/helpers/types";
import type {MapController} from "@/lib/map/controller";
import type {MapState} from "@/lib/map/types";
import type {Action} from "@/types";

import {setMapCursor} from "../actions";
import {makeLayerSelectionSelector} from "../selectors";
import WithMap from "./WithMap";
import {
	type FeatureInteractionName,
	FeatureInteractionNames,
} from "./featureInteractionNames";
import {getIdForLayer} from "./tagLayer";

export {FeatureInteractionNames, type FeatureInteractionName};

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
	selection: FeatureInteractionName;
	options: AnyFeatureInteractionOptions;
};

export type FeatureInteractions = Record<
	FeatureInteractionName,
	FeatureInteraction
>;

const FEATURE_PROPERTY_NAME_SELECTABLE = "selectable";

// TODO: Keep default?
const defaultFeatureSelectionsControllerName = "featureSelections";
const HIGHLIGHT_SELECTION_ID = "highlight";

/** See {@link createHandler} — matches `enableAsyncDispatch` deferral timing elsewhere. */
const FEATURE_INTERACTION_DISPATCH_DELAY_MS = 10;

type PendingInteractionDispatch = {
	actions: Array<Action>;
	cursorAction: Action | null;
};

type HandleEventResult = {
	cache: FeatureInteractionEventCache | null;
	pendingDispatch: PendingInteractionDispatch | null;
};

function quietIfHighlight(action: Action, selectionId: string) {
	return selectionId === HIGHLIGHT_SELECTION_ID ? quiet(action) : action;
}

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
	interactionName: FeatureInteractionName,
	state: MapState,
): string | undefined {
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
 * @param cache hover state used to diff the next hit; see {@link createHandler}
 * @param event openlayers event object
 *
 * @returns computed hover state and any redux actions to dispatch (may be deferred)
 */
function handleEvent(
	mapController: MapEventEmitter,
	featureSelectionsControllerName: string,
	interactionName: FeatureInteractionName,
	options: FeatureInteractionOptions = {},
	cache: FeatureInteractionEventCache | null = null,
	event: MapBrowserEvent,
): HandleEventResult {
	if (!interactionName) {
		return {cache, pendingDispatch: null};
	}

	// TODO: Move code accessing ._map to the controller?
	const map = mapController.getMap();
	if (!map) {
		return {cache, pendingDispatch: null};
	}

	// TODO: Allow interaction during animation for some event types?
	const view = map.getView();
	if (!view || view.getAnimating() || view.getInteracting()) {
		return {cache, pendingDispatch: null};
	}

	if (event.originalEvent) {
		const originalEvent = event.originalEvent;
		const appliedOptions = overrideOptionsForEvent(options, originalEvent);

		if (appliedOptions === false) {
			return {cache, pendingDispatch: null};
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
					quietIfHighlight(
						selectAction(featureSelectionsControllerName, s, f),
						s,
					),
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
				actions.push(
					quietIfHighlight(
						deselect(featureSelectionsControllerName, s, f),
						s,
					),
				);
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
						quietIfHighlight(
							deselect(featureSelectionsControllerName, s, f),
							s,
						),
					),
				);
		});
	}

	if (!actions.length) {
		return {cache, pendingDispatch: null};
	}

	let cursorAction: Action | null = null;
	if (options.cursor) {
		if (hasAdded) {
			newCursor = options.cursor;
		}

		if (!cache || newCursor !== cache.cursor) {
			cursorAction = quiet(
				setMapCursor(mapController.getName(), newCursor),
			);
		}
	}

	return {
		cache: {selections: newSelections, cursor: newCursor},
		pendingDispatch: {actions, cursorAction},
	};
}

function dispatchInteractionActions(
	mapController: MapEventEmitter,
	pendingDispatch: PendingInteractionDispatch,
) {
	if (pendingDispatch.cursorAction) {
		mapController.dispatch(pendingDispatch.cursorAction);
	}

	if (pendingDispatch.actions.length === 1) {
		mapController.dispatch(ensureNonNullable(pendingDispatch.actions[0]));
	} else {
		mapController.dispatch(batchActions(pendingDispatch.actions));
	}
}

/**
 * Returns an OL event handler that maps pointer hits to feature-selection actions.
 *
 * **Deferred dispatch.** Selection actions are not dispatched synchronously inside the
 * OL event handler. Each new event cancels any pending dispatch and schedules a fresh
 * one after {@link FEATURE_INTERACTION_DISPATCH_DELAY_MS}. That serves two purposes:
 *
 * 1. **Hover coalescing** — rapid `pointermove` across hit-tolerance edges (see default
 *    `hitTolerance: 5`) would otherwise select/deselect on every pixel. A short window
 *    lets a brief miss be cancelled when the pointer re-enters the feature.
 * 2. **Defer out of the OL stack** — dispatching immediately would run selection
 *    observers (style / `FeatureSelectionConnector`) during `pointermove`. This mirrors
 *    the motivation for `async()` elsewhere, but hover needs cancel-on-new-event, not
 *    the action queue that `enableAsyncDispatch` provides.
 *
 * **Cache update.** When a dispatch is pending, in-memory `cache` is not updated until
 * the timeout fires. Otherwise a follow-up move off the feature can cancel the pending
 * deselect while `cache` is already empty, leaving highlight stuck in redux (see
 * `highlight-hover.test.ts` / `e2e/highlight.spec.ts`).
 */
function createHandler(
	mapController: MapEventEmitter,
	featureSelectionsControllerName: string,
	options: FeatureInteraction,
) {
	if (!options) {
		return null;
	}

	let cache: FeatureInteractionEventCache | null = null;
	let pendingDispatchTimeout: ReturnType<typeof setTimeout> | null = null;

	const clearPendingDispatch = () => {
		if (pendingDispatchTimeout !== null) {
			clearTimeout(pendingDispatchTimeout);
			pendingDispatchTimeout = null;
		}
	};

	return function interactionHandler(event: MapBrowserEvent) {
		clearPendingDispatch();

		const {cache: nextCache, pendingDispatch} = handleEvent(
			mapController,
			featureSelectionsControllerName,
			options.selection,
			options.options,
			cache,
			event,
		);

		if (pendingDispatch) {
			pendingDispatchTimeout = setTimeout(() => {
				pendingDispatchTimeout = null;
				cache = nextCache;
				dispatchInteractionActions(mapController, pendingDispatch);
			}, FEATURE_INTERACTION_DISPATCH_DELAY_MS);
		} else {
			cache = nextCache;
		}
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
			FeatureInteractionName,
			ReturnType<typeof createHandler>
		> = {
			mouseover: null,
			mousedown: null,
			touch: null,
		};

		this.getAndObserveUncontrolled(
			(state) => ({
				featureInteractions: state.featureInteractions as Record<
					FeatureInteractionName,
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
			isEqual,
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
