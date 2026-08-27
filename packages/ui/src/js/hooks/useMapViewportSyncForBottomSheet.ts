import {useCallback, useEffect, useRef} from "react";
import {useDispatch} from "react-redux";

import {async} from "@mapsight/core/lib/base/actions";
import {deselectAll} from "@mapsight/core/lib/feature-selections/actions";
import {updateMapSize} from "@mapsight/core/lib/map/actions";

import {FEATURE_SELECTIONS, MAP} from "../config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_PRESELECT,
	FEATURE_SELECTION_SELECT,
} from "../config/feature/selections";

type UpdateMapSizeFrom = NonNullable<
	Parameters<typeof updateMapSize>[1]
>["from"];

const DEFAULT_CLEAR_SELECTIONS = [
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_PRESELECT,
	FEATURE_SELECTION_SELECT,
] as const;

export type UseMapViewportSyncForBottomSheetOptions = {
	/** Whether the sheet occupies layout space that affects the map. */
	isOpen: boolean;
	/** Re-sync when selection identity changes (e.g. feature id). */
	syncKey?: string | number | null;
	/** Map controller name. @default `"map"` */
	mapControllerName?: string;
	/**
	 * Side the sheet shrinks from when recentering the map.
	 * @default `"below"`
	 */
	from?: UpdateMapSizeFrom;
	/** @default true */
	reCenter?: boolean;
	/** Feature selections controller name. @default `"featureSelections"` */
	featureSelectionsController?: string;
	/**
	 * Selection modes cleared by `dismissSelection` (for BottomSheet `onDismiss`).
	 * Pass `false` to make `dismissSelection` a no-op.
	 * @default highlight, preselect, select
	 */
	clearSelectionsOnDismiss?: false | readonly string[];
};

export type UseMapViewportSyncForBottomSheetResult = {
	/** Resize/recenter the map after the next animation frame. */
	syncMapViewport: () => void;
	/** Coalesce continuous resize (e.g. sheet drag) into one sync per frame. */
	scheduleMapViewportSync: () => void;
	/** Clear configured feature selections. */
	dismissSelection: () => void;
};

/**
 * Keep the map viewport in sync when an in-flow bottom sheet opens, resizes,
 * or closes — and optionally clear feature selection on dismiss.
 *
 * Pair with {@link BottomSheet}: pass `dismissSelection` to `onDismiss`,
 * `scheduleMapViewportSync` to `onHeightChange`, and `syncMapViewport` after
 * snap changes.
 */
export default function useMapViewportSyncForBottomSheet({
	isOpen,
	syncKey,
	mapControllerName = MAP,
	from = "below",
	reCenter = true,
	featureSelectionsController = FEATURE_SELECTIONS,
	clearSelectionsOnDismiss = DEFAULT_CLEAR_SELECTIONS,
}: UseMapViewportSyncForBottomSheetOptions): UseMapViewportSyncForBottomSheetResult {
	const dispatch = useDispatch();
	const prevOpenForMapRef = useRef(false);
	const dragMapSyncFrameRef = useRef<number | null>(null);

	const syncMapViewport = useCallback(() => {
		dispatch(
			async(
				updateMapSize(mapControllerName, {
					from,
					reCenter,
				}),
			),
		);
	}, [dispatch, from, mapControllerName, reCenter]);

	const scheduleMapViewportSync = useCallback(() => {
		if (typeof window === "undefined") {
			syncMapViewport();
			return;
		}

		if (dragMapSyncFrameRef.current !== null) {
			return;
		}

		dragMapSyncFrameRef.current = window.requestAnimationFrame(() => {
			dragMapSyncFrameRef.current = null;
			syncMapViewport();
		});
	}, [syncMapViewport]);

	const dismissSelection = useCallback(() => {
		if (clearSelectionsOnDismiss === false) {
			return;
		}

		for (const selection of clearSelectionsOnDismiss) {
			dispatch(deselectAll(featureSelectionsController, selection));
		}
	}, [clearSelectionsOnDismiss, dispatch, featureSelectionsController]);

	useEffect(() => {
		if (!isOpen || typeof window === "undefined") {
			return;
		}

		const frame = window.requestAnimationFrame(() => {
			syncMapViewport();
		});
		return () => window.cancelAnimationFrame(frame);
	}, [isOpen, syncKey, syncMapViewport]);

	useEffect(() => {
		if (prevOpenForMapRef.current && !isOpen) {
			if (typeof window === "undefined") {
				syncMapViewport();
				prevOpenForMapRef.current = isOpen;
				return;
			}

			const frame = window.requestAnimationFrame(() => {
				syncMapViewport();
			});
			prevOpenForMapRef.current = isOpen;
			return () => window.cancelAnimationFrame(frame);
		}
		prevOpenForMapRef.current = isOpen;
	}, [isOpen, syncMapViewport]);

	useEffect(() => {
		return () => {
			if (
				typeof window !== "undefined" &&
				dragMapSyncFrameRef.current !== null
			) {
				window.cancelAnimationFrame(dragMapSyncFrameRef.current);
			}
		};
	}, []);

	return {
		syncMapViewport,
		scheduleMapViewportSync,
		dismissSelection,
	};
}
