import {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {FocusTrap} from "focus-trap-react";

import {removeFrom} from "@mapsight/core/lib/base/actions";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import {featureSelectionInfoUiOptionsSelector} from "../../store/selectors";
import type {MapsightUiFeature} from "../../types";
import FeatureDetailsContent from "../feature-details-content";
import CloseButton from "./close-button";
import Header from "./header";
import WithStickyHeader from "./with-sticky-header";
import WithoutStickyHeader from "./without-sticky-header";
import Wrapper from "./wrapper";

export default function FeatureSelectionInfo({
	feature,
	enableKeyboardControl,
}: {
	feature: MapsightUiFeature | null;
	enableKeyboardControl: boolean;
}) {
	const dispatch = useDispatch();
	const hasStickyHeader = useSelector(
		featureSelectionInfoUiOptionsSelector,
	).stickyHeader;
	const renderWrapper = useCallback(
		(attrs) => (
			<Wrapper
				feature={feature}
				enableKeyboardControl={enableKeyboardControl}
				{...attrs}
			/>
		),
		[enableKeyboardControl, feature],
	);

	const removeSelection = useCallback(() => {
		dispatch(
			removeFrom(
				[FEATURE_SELECTIONS, FEATURE_SELECTION_SELECT, "features"],
				feature?.id,
			),
		);
	}, [dispatch, feature?.id]);

	if (!feature) {
		return null;
	}

	const T = hasStickyHeader ? WithStickyHeader : WithoutStickyHeader;
	return (
		<FocusTrap
			active={enableKeyboardControl}
			focusTrapOptions={{
				clickOutsideDeactivates: true,
				onDeactivate: removeSelection,
			}}
		>
			<T
				feature={feature}
				close={
					<CloseButton
						feature={feature}
						enableKeyboardControl={enableKeyboardControl}
					/>
				}
				header={<Header feature={feature} />}
				content={
					<div className="ms3-feature-selection-info__content">
						<FeatureDetailsContent feature={feature} />
					</div>
				}
				renderWrapper={renderWrapper}
			/>
		</FocusTrap>
	);
}
