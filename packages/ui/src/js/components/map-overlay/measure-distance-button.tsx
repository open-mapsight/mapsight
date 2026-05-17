import {Fragment, useCallback, useEffect, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";

import {createSelector} from "reselect";

import {removeAllFeatures} from "@mapsight/core/lib/feature-sources/actions";
import {createFilteredFeatureSourceSelector} from "@mapsight/core/lib/feature-sources/selectors";

import {FEATURE_SOURCES, MAP} from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";
import useControllableState from "../../hooks/useControllableState";
import {
	createActivateAction,
	createDeactivateAction,
} from "../../plugins/common/measure-distance";
import MeasureDistanceInfo from "./measure-distance-overlay";
import ToolOverlay from "./tool-overlay";

/*
 TODO: aria? abort on escape key press?
 */
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
				className="ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--measure-distance"
				type="button"
				onClick={toggle}
			>
				<span className="ms3-map-overlay__button__label">
					{translate("ui.measure-distance.title")}
				</span>
			</button>

			{isOpened && (
				<ToolOverlay
					label={translate("ui.measure-distance.title")}
					onClose={closeAndReset}
					text={translate(
						feature
							? "ui.measure-distance.instructions-done"
							: "ui.measure-distance.instructions",
					)}
				>
					{feature && <MeasureDistanceInfo feature={feature} />}
				</ToolOverlay>
			)}
		</Fragment>
	);
};

export default MeasureDistanceButton;
