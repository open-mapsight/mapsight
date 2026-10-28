import type {ElementType, PropsWithChildren, ReactNode} from "react";
import {
	useCallback,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import {createPortal} from "react-dom";
import {ReactReduxContext} from "react-redux";

import type {MapController} from "@mapsight/core/lib/map/controller";
import type {EnhancedStore} from "@mapsight/core/types";

import {MAP} from "../../config/constants/controllers";
import {Heading, HeadingContent, useHeadingElement} from "../../headings";
import {translate} from "../../helpers/i18n";
import {shouldDismissOnEscape} from "../../hooks/useOverlayDismiss";
import CloseOverlayButton from "../close-overlay-button";

type Props = {
	id?: string;
	text: ReactNode;
	label: ReactNode;
	onClose: () => void;
	headlineAs?: ElementType;
	/**
	 * For tools operated on the focused map: a skip link to the map, and while
	 * open a skip link right after the map back to this overlay. Both only
	 * show on focus; nothing traps focus.
	 */
	mapJump?: boolean;
	mapControllerName?: string;
};

/** The OL map, if a Mapsight store is provided (ToolOverlay also renders without one). */
function useGetMap(mapControllerName: string) {
	const store = useContext(ReactReduxContext)?.store as
		EnhancedStore | undefined;
	return useCallback(
		() =>
			typeof store?.getController === "function"
				? (
						store.getController(mapControllerName) as
							MapController | undefined
					)?.getMap()
				: undefined,
		[store, mapControllerName],
	);
}

/** Mount a node right after the map target while active, for the return link. */
function useMapReturnSlot(
	getMap: () => ReturnType<MapController["getMap"]> | undefined,
	active: boolean,
): HTMLElement | null {
	const [slot, setSlot] = useState<HTMLElement | null>(null);
	useEffect(() => {
		const map = getMap();
		if (!active || !map) return;
		let container: HTMLElement | undefined;
		const place = () => {
			container?.remove();
			const target = map.getTargetElement();
			container = target?.ownerDocument.createElement("div");
			if (target && container) {
				container.className = "ms3-map-return";
				target.after(container);
			}
			setSlot(container ?? null);
		};
		place();
		map.on("change:target", place);
		return () => {
			map.un("change:target", place);
			container?.remove();
			setSlot(null);
		};
	}, [getMap, active]);
	return slot;
}

const ToolOverlay = ({
	id,
	text,
	children,
	label,
	onClose,
	headlineAs,
	mapJump = false,
	mapControllerName = MAP,
}: PropsWithChildren<Props>) => {
	const Headline = useHeadingElement("toolTitle", "h3", headlineAs);
	const headingId = useId();
	const overlayRef = useRef<HTMLDivElement>(null);
	const getMap = useGetMap(mapControllerName);
	const returnSlot = useMapReturnSlot(getMap, mapJump);
	const focusMap = () => getMap()?.getTargetElement()?.focus();

	// Keyboard users operate the tool on the map and reach it from its toggle,
	// so Escape there closes it too. Listen after React's bubble handlers but
	// before document-level focus traps, which may otherwise exit fullscreen.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const overlay = overlayRef.current;
			const target =
				event.target instanceof Element ? event.target : null;
			if (
				!overlay ||
				!target ||
				overlay.contains(target) ||
				event.key !== "Escape" ||
				event.defaultPrevented
			) {
				return;
			}
			const onToggle = Boolean(
				id && target.closest(`[aria-controls~="${CSS.escape(id)}"]`),
			);
			if (!onToggle && !target.closest(".ms3-map-target")) {
				return;
			}
			const dialog = target.closest(
				'dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]',
			);
			if (dialog && !dialog.contains(overlay)) {
				return;
			}
			event.preventDefault();
			onClose();
		};
		const root = document.body;
		root.addEventListener("keydown", onKeyDown);
		return () => root.removeEventListener("keydown", onKeyDown);
	}, [id, onClose]);

	return (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Delegate Escape from interactive descendants of the region.
		<div
			ref={overlayRef}
			id={id}
			className="ms3-tool-overlay"
			role="region"
			aria-labelledby={headingId}
			tabIndex={mapJump ? -1 : undefined}
			onKeyDown={(event) => {
				if (
					shouldDismissOnEscape(event.nativeEvent, overlayRef.current)
				) {
					event.preventDefault();
					onClose();
				}
			}}
		>
			<CloseOverlayButton onClose={onClose} />
			<Heading
				as={Headline}
				className="ms3-tool-overlay__header"
				id={headingId}
			>
				{label}
			</Heading>
			<HeadingContent headingAs={Headline}>
				{mapJump && (
					<button
						type="button"
						className="ms3-skip-link"
						onClick={focusMap}
					>
						{translate("ui.tool-overlay.to-map")}
					</button>
				)}
				{text && <p className="ms3-tool-overlay__text">{text}</p>}
				{children}
			</HeadingContent>
			{returnSlot &&
				createPortal(
					<button
						type="button"
						className="ms3-skip-link"
						onClick={() => overlayRef.current?.focus()}
					>
						{translate("ui.tool-overlay.back-to-tool").replace(
							"{name}",
							typeof label === "string" ? label : "",
						)}
					</button>,
					returnSlot,
				)}
		</div>
	);
};

export default ToolOverlay;
