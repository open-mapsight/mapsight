import {Fragment, useCallback, useEffect, useId, useMemo, useRef} from "react";
import {useDispatch, useSelector, useStore} from "react-redux";

import {createSelector} from "@reduxjs/toolkit";

import {removeAllFeatures} from "@mapsight/core/lib/feature-sources/actions";
import {createFilteredFeatureSourceSelector} from "@mapsight/core/lib/feature-sources/selectors";
import type {EnhancedStore} from "@mapsight/core/types";

import {FEATURE_SOURCES, MAP} from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";
import useControllableState from "../../hooks/useControllableState";
import {
	createActivateAction,
	createDeactivateAction,
	formatLinkMarkerHash,
	shareMapCenter,
} from "../../plugins/browser/share-position-link";
import LinkShare from "../link-share";
import ToolKeyboardHelp from "./tool-keyboard-help";
import ToolOverlay from "./tool-overlay";

type SharePositionLinkButtonProps = {
	pluginName?: string;
	opened?: boolean;
	onOpenedChange?: (opened: boolean) => void;
};

const SharePositionLinkButton = ({
	pluginName = "sharePositionLink",
	opened,
	onOpenedChange,
}: SharePositionLinkButtonProps) => {
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

	const coords =
		feature?.geometry?.type === "Point"
			? feature.geometry.coordinates
			: undefined;
	const shareUrl = useMemo(() => {
		const lat = coords?.[1];
		const lon = coords?.[0];
		if (typeof lat === "number" && typeof lon === "number") {
			const url = new URL(location.href);
			url.protocol = "https:";
			url.hash = formatLinkMarkerHash(lat, lon);
			return url.href;
		}

		return null;
	}, [coords]);

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
				className="ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--share-link"
				type="button"
				onClick={toggle}
				aria-expanded={isOpened}
				aria-controls={isOpened ? overlayId : undefined}
			>
				<span className="ms3-map-overlay__button__label">
					{translate("ui.share-position-link.title")}
				</span>
			</button>

			{isOpened && (
				<ToolOverlay
					id={overlayId}
					label={translate("ui.share-position-link.title")}
					onClose={closeAndReset}
					text={translate(
						keyboardDrawing
							? "ui.share-position-link.keyboard-instructions"
							: "ui.share-position-link.instructions",
					)}
				>
					{keyboardDrawing && (
						<button
							className="ms3-map-tool-action"
							type="button"
							onClick={() => shareMapCenter(store, pluginName)}
						>
							{translate("ui.share-position-link.share-center")}
						</button>
					)}
					{keyboardDrawing && (
						<ToolKeyboardHelp
							items={[
								{
									keys: [
										translate("ui.keys.space"),
										translate("ui.keys.enter"),
									],
									action: translate(
										"ui.share-position-link.keyboard.select",
									),
								},
								{
									keys: [translate("ui.keys.backspace")],
									action: translate(
										"ui.share-position-link.keyboard.remove",
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
					{feature && (
						<LinkShare
							url={shareUrl}
							title={translate(
								"ui.share-position-link.shareTitle",
							)}
							buttonLabel={translate(
								"ui.share-position-link.shareButtonLabel",
							)}
							onFinished={close}
							onError={undefined}
						/>
					)}
				</ToolOverlay>
			)}
		</Fragment>
	);
};

export default SharePositionLinkButton;
