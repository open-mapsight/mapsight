import {
	type ElementType,
	type HTMLAttributes,
	type Ref,
	useCallback,
	useId,
	useRef,
} from "react";
import {FocusScope, mergeRefs, useFocusManager} from "react-aria";
import {useDispatch, useSelector} from "react-redux";

import {removeFrom} from "@mapsight/core/lib/base/actions";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import {HeadingContent, useHeadingElement} from "../../headings";
import {shouldDismissOnEscape} from "../../hooks/useOverlayDismiss";
import {featureSelectionInfoUiOptionsSelector} from "../../store/selectors";
import type {MapsightUiFeature} from "../../types";
import ErrorBoundary from "../error-boundary";
import FeatureDetailsContent from "../feature-details-content";
import CloseButton from "./close-button";
import Header from "./header";
import WithStickyHeader from "./with-sticky-header";
import WithoutStickyHeader from "./without-sticky-header";
import Wrapper from "./wrapper";

export default function FeatureSelectionInfo({
	feature,
	enableKeyboardControl,
	trapFocus: trapFocusProp,
	isOpen = true,
	headlineAs,
	landmark = true,
}: {
	feature: MapsightUiFeature | null;
	enableKeyboardControl: boolean;
	/** Opt in to trapping Tab focus in this non-modal region. Defaults to false. */
	trapFocus?: boolean;
	/** False renders only the inert collapse-animation snapshot, outside the live focus scope. */
	isOpen?: boolean;
	headlineAs?: ElementType;
	/** Disable inside an already named region (e.g. BottomSheet); keeps the details heading. */
	landmark?: boolean;
}) {
	const Headline = useHeadingElement("featureDetailsTitle", headlineAs);
	const dispatch = useDispatch();
	const options = useSelector(featureSelectionInfoUiOptionsSelector);
	const hasStickyHeader = options.stickyHeader;
	const trapFocus = trapFocusProp ?? options.trapFocus ?? false;
	const headingId = useId();
	const parentFocusManager = useFocusManager();
	const fallbackFocus = useCallback(() => {
		parentFocusManager?.focusFirst();
	}, [parentFocusManager]);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const removeSelection = useCallback(() => {
		dispatch(
			removeFrom(
				[FEATURE_SELECTIONS, FEATURE_SELECTION_SELECT, "features"],
				feature?.id,
			),
		);
	}, [dispatch, feature?.id]);

	const renderWrapper = useCallback(
		(
			attrs: HTMLAttributes<HTMLDivElement> & {ref?: Ref<HTMLDivElement>},
		) => (
			<Wrapper
				enableKeyboardControl={isOpen && enableKeyboardControl}
				onKeyDown={(event) => {
					if (
						isOpen &&
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
				fallbackFocus={isOpen ? fallbackFocus : undefined}
				inert={!isOpen}
				aria-hidden={!isOpen || undefined}
				role={landmark ? "region" : undefined}
				aria-labelledby={landmark ? headingId : undefined}
				{...attrs}
				ref={mergeRefs(attrs.ref, wrapperRef)}
			/>
		),
		[
			enableKeyboardControl,
			headingId,
			landmark,
			removeSelection,
			isOpen,
			fallbackFocus,
		],
	);

	if (!feature) {
		return null;
	}

	const T = hasStickyHeader ? WithStickyHeader : WithoutStickyHeader;
	const content = (
		<T
			feature={feature}
			close={<CloseButton onClose={removeSelection} />}
			header={
				<Header
					feature={feature}
					id={headingId}
					headlineAs={Headline}
				/>
			}
			content={
				<HeadingContent headingAs={Headline}>
					<div className="ms3-feature-selection-info__content">
						<FeatureDetailsContent feature={feature} />
					</div>
				</HeadingContent>
			}
			renderWrapper={renderWrapper}
		/>
	);
	return (
		<ErrorBoundary resetKeys={[feature.id]} variant="region">
			{isOpen ? (
				<FocusScope
					key={feature.id}
					autoFocus={enableKeyboardControl}
					restoreFocus
					contain={enableKeyboardControl && trapFocus}
				>
					{content}
				</FocusScope>
			) : (
				content
			)}
		</ErrorBoundary>
	);
}
