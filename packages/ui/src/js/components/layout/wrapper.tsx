import type {HTMLAttributes, ReactNode} from "react";
import {memo, useContext, useId, useMemo, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";

import {FocusTrap} from "focus-trap-react";

import {VIEW_FULLSCREEN} from "../../config/constants/app";
import {announceStatus} from "../../helpers/announce-status";
import {ComponentsContext} from "../../helpers/components";
import {translate} from "../../helpers/i18n";
import {isOverlayChromeView, pairedView} from "../../helpers/view-pairing";
import useInertOutside from "../../hooks/useInertOutside";
import useNestedPlatformModal from "../../hooks/useNestedPlatformModal";
import {setView} from "../../store/actions";
import {
	isEmbeddedMapSelector,
	mapVisible,
	viewSelector,
} from "../../store/selectors";
import ErrorBoundary from "../error-boundary";

import "./host-slots";

export type AppWrapperProps = HTMLAttributes<HTMLDivElement> & {
	children?: ReactNode;
};

function AppWrapper({
	children,
	className: classNameProp = "",
	...attributes
}: AppWrapperProps) {
	const dispatch = useDispatch();
	const view = useSelector(viewSelector);
	const isEmbeddedMap = useSelector(isEmbeddedMapSelector);
	const isMapVisible = useSelector(mapVisible);
	const {AppWrapperStart} = useContext(ComponentsContext);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const isOverlayViewRef = useRef(false);
	const viewRef = useRef(view);
	const descriptionId = useId();

	const isOverlayView = isOverlayChromeView(view);
	isOverlayViewRef.current = isOverlayView;
	viewRef.current = view;

	useInertOutside(wrapperRef, isOverlayView);
	const nestedPlatformModal = useNestedPlatformModal(wrapperRef);

	const overlayLabel = isOverlayView
		? translate(
				view === VIEW_FULLSCREEN
					? "ui.wrapper.overlay.fullscreen"
					: "ui.wrapper.overlay.mapOnly",
			)
		: undefined;
	const escapeHint = translate("ui.wrapper.overlay.escape");

	const focusTrapOptions = useMemo(
		() => ({
			allowOutsideClick: true,
			clickOutsideDeactivates: false,
			escapeDeactivates: true,
			preventScroll: true,
			returnFocusOnDeactivate: true,
			fallbackFocus: () => wrapperRef.current ?? document.body,
			initialFocus: () => {
				const active = document.activeElement;
				if (
					active instanceof HTMLElement &&
					wrapperRef.current?.contains(active)
				) {
					return active;
				}
				return wrapperRef.current ?? false;
			},
			onDeactivate: () => {
				if (!isOverlayViewRef.current) {
					return;
				}
				dispatch(setView(pairedView(viewRef.current)));
			},
			onPostActivate: () => {
				if (overlayLabel) {
					announceStatus(`${overlayLabel}. ${escapeHint}`);
				}
			},
		}),
		[dispatch, escapeHint, overlayLabel],
	);

	const className = [
		"ms3-wrapper",
		`ms3-wrapper--${view}`,
		isEmbeddedMap ? "ms3-wrapper--embedded" : "",
		isMapVisible ? "" : "ms3-wrapper--withoutmap",
		classNameProp,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<FocusTrap
			active={isOverlayView}
			paused={nestedPlatformModal}
			focusTrapOptions={focusTrapOptions}
		>
			<div
				{...attributes}
				ref={wrapperRef}
				className={className}
				role={isOverlayView ? "dialog" : undefined}
				aria-modal={isOverlayView ? true : undefined}
				aria-label={overlayLabel}
				aria-describedby={isOverlayView ? descriptionId : undefined}
				tabIndex={isOverlayView ? -1 : undefined}
			>
				{isOverlayView ? (
					<p id={descriptionId} className="ms3-visuallyhidden">
						{escapeHint}
					</p>
				) : null}
				{AppWrapperStart ? (
					<ErrorBoundary variant="region">
						<AppWrapperStart />
					</ErrorBoundary>
				) : null}
				{children}
			</div>
		</FocusTrap>
	);
}

export default memo(AppWrapper);
