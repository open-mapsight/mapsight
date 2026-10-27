import type {PropsWithChildren, ReactNode} from "react";
import {useId, useRef} from "react";

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
