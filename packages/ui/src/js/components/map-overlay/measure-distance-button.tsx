import {
	Fragment,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import {useDispatch, useSelector, useStore} from "react-redux";

import {createSelector} from "@reduxjs/toolkit";

import {removeAllFeatures} from "@mapsight/core/lib/feature-sources/actions";
import {createFilteredFeatureSourceSelector} from "@mapsight/core/lib/feature-sources/selectors";
import type {MapController} from "@mapsight/core/lib/map/controller";
import type {EnhancedStore} from "@mapsight/core/types";

import {FEATURE_SOURCES, MAP} from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";
import useControllableState from "../../hooks/useControllableState";
import {
	createActivateAction,
	createDeactivateAction,
	finishKeyboardMeasurement,
	observeKeyboardMeasurement,
} from "../../plugins/common/measure-distance";
import MeasureDistanceInfo, {
	MeasurementOutput,
	formatLength,
} from "./measure-distance-overlay";
import ToolKeyboardHelp from "./tool-keyboard-help";
import ToolOverlay from "./tool-overlay";

type MeasureDistanceButtonProps = {
	pluginName?: string;
	opened?: boolean;
	onOpenedChange?: (opened: boolean) => void;
};

const MeasureDistanceButton = ({
	pluginName = "measureDistance",
	opened,
	onOpenedChange,
}: MeasureDistanceButtonProps) => {
	const [isOpened = false, setIsOpened] = useControllableState({
		prop: opened,
		defaultProp: false,
		onChange: onOpenedChange,
	});

	const activate = useMemo(
		() => createActivateAction(MAP, pluginName),
		[pluginName],
	);
	const deactivate = useMemo(
		() => createDeactivateAction(MAP, pluginName),
		[pluginName],
	);
	const resetAction = useMemo(
		() => removeAllFeatures(FEATURE_SOURCES, `${pluginName}_featureSource`),
		[pluginName],
	);
	const featureSelector = useMemo(
		() =>
			createSelector(
				createFilteredFeatureSourceSelector(
					FEATURE_SOURCES,
					`${pluginName}_featureSource`,
					MAP,
				),
				(featureSourceState) => featureSourceState?.data?.features?.[0],
			),
		[pluginName],
	);

	const store = useStore() as EnhancedStore;
	const keyboardDrawing = useSelector(
		(state: {
			map?: {
				interactions?: Record<
					string,
					{options?: {keyboardTool?: string}}
				>;
			};
		}) =>
			state.map?.interactions?.[`${pluginName}_drawInteraction`]?.options
				?.keyboardTool === pluginName,
	);
	const dispatch = useDispatch();
	const feature = useSelector(featureSelector);

	const toggle = useCallback(() => {
		setIsOpened(!isOpened);
	}, [isOpened, setIsOpened]);

	const close = useCallback(() => {
		setIsOpened(false);
	}, [setIsOpened]);

	useEffect(() => {
		dispatch(isOpened ? activate : deactivate);
	}, [dispatch, deactivate, isOpened, activate]);

	const overlayId = useId();
	const triggerRef = useRef<HTMLButtonElement>(null);

	// The line being drawn (pointer clicks included): "Done" only exists while
	// measuring and only works from two points; its length is shown live.
	const [sketchVertices, setSketchVertices] = useState(0);
	const [sketchLength, setSketchLength] = useState<number | null>(null);
	useEffect(() => {
		if (!isOpened || !keyboardDrawing) return;
		const map = (store.getController(MAP) as MapController).getMap();
		if (!map) return;
		return observeKeyboardMeasurement(
			map,
			pluginName,
			({vertices, length}) => {
				setSketchVertices(vertices);
				setSketchLength(length);
			},
		);
	}, [isOpened, keyboardDrawing, store, pluginName]);
	const canFinish = sketchVertices >= 2;

	const closeAndReset = useCallback(
		function () {
			dispatch(resetAction);
			close();
			triggerRef.current?.focus();
		},
		[close, dispatch, resetAction],
	);

	return (
		<Fragment>
			<button
				ref={triggerRef}
				className="ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--measure-distance"
				type="button"
				onClick={toggle}
				aria-expanded={isOpened}
				aria-controls={isOpened ? overlayId : undefined}
			>
				<span className="ms3-map-overlay__button__label">
					{translate("ui.measure-distance.title")}
				</span>
			</button>

			{isOpened && (
				<ToolOverlay
					id={overlayId}
					label={translate("ui.measure-distance.title")}
					onClose={closeAndReset}
					mapJump={keyboardDrawing}
					text={translate(
						keyboardDrawing
							? feature
								? "ui.measure-distance.keyboard-instructions-done"
								: "ui.measure-distance.keyboard-instructions"
							: feature
								? "ui.measure-distance.instructions-done"
								: "ui.measure-distance.instructions",
					)}
				>
					{sketchLength !== null ? (
						<MeasurementOutput value={formatLength(sketchLength)} />
					) : (
						feature && <MeasureDistanceInfo feature={feature} />
					)}
					{keyboardDrawing && sketchVertices > 0 && (
						<button
							className="ms3-map-tool-action"
							type="button"
							// Focusable while disabled, so keyboard and screen reader
							// users find it and learn it needs a second point.
							aria-disabled={canFinish ? undefined : true}
							onClick={() => {
								const map = (
									store.getController(MAP) as MapController
								).getMap();
								if (canFinish && map)
									finishKeyboardMeasurement(map, pluginName);
							}}
						>
							{translate("ui.measure-distance.finish")}
						</button>
					)}
					{keyboardDrawing && (
						<ToolKeyboardHelp
							items={[
								{
									keys: [translate("ui.keys.space")],
									action: translate(
										"ui.measure-distance.keyboard.add",
									),
								},
								{
									keys: [translate("ui.keys.enter")],
									action: translate(
										"ui.measure-distance.keyboard.finish",
									),
								},
								{
									keys: [translate("ui.keys.backspace")],
									action: translate(
										"ui.measure-distance.keyboard.remove",
									),
								},
								{
									keys: [translate("ui.keys.arrows")],
									action: translate(
										"ui.tool-overlay.keyboard.pan",
									),
								},
							]}
						/>
					)}
				</ToolOverlay>
			)}
		</Fragment>
	);
};

export default MeasureDistanceButton;
