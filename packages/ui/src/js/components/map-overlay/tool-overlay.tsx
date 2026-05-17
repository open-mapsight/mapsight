import type {PropsWithChildren, ReactNode} from "react";

import CloseOverlayButton from "../close-overlay-button";

type Props = {
	text: ReactNode;
	label: ReactNode;
	onClose: () => void;
};

const ToolOverlay = ({
	text,
	children,
	label,
	onClose,
}: PropsWithChildren<Props>) => {
	// TODO: Aria role, focus trap, close on escape etc.?
	return (
		<div className="ms3-tool-overlay">
			<CloseOverlayButton onClose={onClose} />
			<h3 className="ms3-tool-overlay__header">{label}</h3>
			{text && <p className="ms3-tool-overlay__text">{text}</p>}
			{children}
		</div>
	);
};

export default ToolOverlay;
