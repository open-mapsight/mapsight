import type {ElementType, PropsWithChildren, ReactNode} from "react";
import {useEffect, useId, useRef} from "react";

import {Heading, HeadingContent, useHeadingElement} from "../../headings";
import {shouldDismissOnEscape} from "../../hooks/useOverlayDismiss";
import CloseOverlayButton from "../close-overlay-button";

type Props = {
	id?: string;
	text: ReactNode;
	label: ReactNode;
	onClose: () => void;
	headlineAs?: ElementType;
};

const ToolOverlay = ({
	id,
	text,
	children,
	label,
	onClose,
	headlineAs,
}: PropsWithChildren<Props>) => {
	const Headline = useHeadingElement("toolTitle", "h3", headlineAs);
	const headingId = useId();
	const overlayRef = useRef<HTMLDivElement>(null);

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
				{text && <p className="ms3-tool-overlay__text">{text}</p>}
				{children}
			</HeadingContent>
		</div>
	);
};

export default ToolOverlay;
