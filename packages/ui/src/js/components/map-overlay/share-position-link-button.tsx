import {Fragment, useCallback, useEffect, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";

import {createSelector} from "@reduxjs/toolkit";

import {removeAllFeatures} from "@mapsight/core/lib/feature-sources/actions";
import {createFilteredFeatureSourceSelector} from "@mapsight/core/lib/feature-sources/selectors";

import {FEATURE_SOURCES, MAP} from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";
import useControllableState from "../../hooks/useControllableState";
import {
	createActivateAction,
	createDeactivateAction,
} from "../../plugins/browser/share-position-link";
import LinkShare from "../link-share";
import ToolOverlay from "./tool-overlay";

const applyPrecisionToCoordinates = (num) =>
	Number.parseFloat(num).toPrecision(6);

/*
 TODO: aria? abort on escape key press?
 */
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

	const dispatch = useDispatch();
	const feature = useSelector(featureSelector);

	const coords =
		feature?.geometry?.type === "Point"
			? feature.geometry.coordinates
			: undefined;
	const shareUrl = useMemo(() => {
		if (coords) {
			const url = new URL(location.href);
			url.protocol = "https:";
			url.hash = `#lm=${applyPrecisionToCoordinates(
				coords[1],
			)}/${applyPrecisionToCoordinates(coords[0])}`;
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

	const closeAndReset = useCallback(
		function () {
			dispatch(resetAction);
			close();
		},
		[close, dispatch, resetAction],
	);

	return (
		<Fragment>
			<button
				className="ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--share-link"
				type="button"
				onClick={toggle}
			>
				<span className="ms3-map-overlay__button__label">
					{translate("ui.share-position-link.title")}
				</span>
			</button>

			{isOpened && (
				<ToolOverlay
					label={translate("ui.share-position-link.title")}
					onClose={closeAndReset}
					text={translate("ui.share-position-link.instructions")}
				>
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
