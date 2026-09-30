import type {PropsWithChildren, ReactNode} from "react";
import {useEffect, useId} from "react";

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

	// Capture Escape at the document so it does not reach outer handlers, without
	// putting a keyboard listener on the non-interactive region element.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.stopPropagation();
				onClose();
			}
		};
		document.addEventListener("keydown", onKeyDown, true);
		return () => document.removeEventListener("keydown", onKeyDown, true);
	}, [onClose]);

	return (
		<div
			id={id}
			className="ms3-tool-overlay"
			role="region"
			aria-labelledby={headingId}
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
