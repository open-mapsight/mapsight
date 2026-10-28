import type {PropsWithChildren, ReactNode} from "react";
import {useEffect, useId, useRef} from "react";

import {shouldDismissOnEscape} from "../../hooks/useOverlayDismiss";
import CloseOverlayButton from "../close-overlay-button";

type Props = {
	id?: string;
	text: ReactNode;
	label: ReactNode;
	onClose: () => void;
};

const ToolOverlay = ({
	id,
	text,
	children,
	label,
	onClose,
}: PropsWithChildren<Props>) => {
	const headingId = useId();
	const overlayRef = useRef<HTMLDivElement>(null);

	// Keyboard users operate the tool on the map and reach it from its toggle,
	// so Escape there closes it too (bubble phase, handled events excluded).
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
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
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
			<h3 className="ms3-tool-overlay__header" id={headingId}>
				{label}
			</h3>
			{text && <p className="ms3-tool-overlay__text">{text}</p>}
			{children}
		</div>
	);
};

export default ToolOverlay;
