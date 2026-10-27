import {type HTMLAttributes, type Ref, useCallback, useId, useRef} from "react";
import {mergeRefs} from "react-aria";
import {useDispatch, useSelector} from "react-redux";

import {removeFrom} from "@mapsight/core/lib/base/actions";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import {shouldDismissOnEscape} from "../../hooks/useOverlayDismiss";
import {featureSelectionInfoUiOptionsSelector} from "../../store/selectors";
import type {MapsightUiFeature} from "../../types";
import ErrorBoundary from "../error-boundary";
import FeatureDetailsContent from "../feature-details-content";
import CloseButton from "./close-button";
import Header from "./header";
import useSelectionFocus from "./useSelectionFocus";
import WithStickyHeader from "./with-sticky-header";
import WithoutStickyHeader from "./without-sticky-header";
import Wrapper from "./wrapper";

export default function FeatureSelectionInfo({
	feature,
	enableKeyboardControl,
	trapFocus: trapFocusProp,
}: {
	feature: MapsightUiFeature | null;
	enableKeyboardControl: boolean;
	/** Opt in to trapping Tab focus in this non-modal region. Defaults to false. */
	trapFocus?: boolean;
}) {
	const dispatch = useDispatch();
	const options = useSelector(featureSelectionInfoUiOptionsSelector);
	const hasStickyHeader = options.stickyHeader;
	const trapFocus = trapFocusProp ?? options.trapFocus ?? false;
	const headingId = useId();
	const wrapperRef = useRef<HTMLDivElement>(null);
	const {rememberOrigin, restoreFocus} = useSelectionFocus();

	const removeSelection = useCallback(() => {
		restoreFocus();
		dispatch(
			removeFrom(
				[FEATURE_SELECTIONS, FEATURE_SELECTION_SELECT, "features"],
				feature?.id,
			),
		);
	}, [dispatch, feature?.id, restoreFocus]);

	const renderWrapper = useCallback(
		(
			attrs: HTMLAttributes<HTMLDivElement> & {ref?: Ref<HTMLDivElement>},
		) => (
			<Wrapper
				feature={feature}
				enableKeyboardControl={enableKeyboardControl}
				trapFocus={trapFocus}
				onBeforeFocus={rememberOrigin}
				onKeyDown={(event) => {
					if (
						enableKeyboardControl &&
						shouldDismissOnEscape(
							event.nativeEvent,
							wrapperRef.current,
						)
					) {
						event.preventDefault();
						removeSelection();
					}
				}}
				role="region"
				aria-labelledby={headingId}
				{...attrs}
				ref={mergeRefs(attrs.ref, wrapperRef)}
			/>
		),
		[
			enableKeyboardControl,
			feature,
			headingId,
			rememberOrigin,
			removeSelection,
			trapFocus,
		],
	);

	if (!feature) {
		return null;
	}

	const T = hasStickyHeader ? WithStickyHeader : WithoutStickyHeader;
	return (
		<ErrorBoundary resetKeys={[feature.id]} variant="region">
			<T
				feature={feature}
				close={<CloseButton onClose={removeSelection} />}
				header={<Header feature={feature} id={headingId} />}
				content={
					<div className="ms3-feature-selection-info__content">
						<FeatureDetailsContent feature={feature} />
					</div>
				}
				renderWrapper={renderWrapper}
			/>
		</ErrorBoundary>
	);
}
