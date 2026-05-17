import type {KeyboardEvent, MouseEvent, ReactNode} from "react";
import type {Props as ReactModalProps} from "react-modal";
import ReactModal from "react-modal";

import CloseOverlayButton from "./close-overlay-button";

export type Props = ReactModalProps & {
	closeLabel?: string;
	headline: ReactNode;
};

const Modal = ({children, closeLabel, headline, ...props}: Props) => {
	const handleClose = (event: MouseEvent | KeyboardEvent) =>
		props.onRequestClose?.(event);

	return (
		<ReactModal
			onRequestClose={handleClose}
			className="ms3-modal"
			overlayClassName="ms3-app-overlay"
			shouldCloseOnOverlayClick={true}
			{...props}
		>
			<div className="ms3-modal__inner ms3-modal__inner--search">
				<div className="ms3-modal__header">
					<h3 className="ms3-modal__headline">{headline}</h3>
					<div className="ms3-modal__close">
						<CloseOverlayButton
							label={closeLabel}
							onClose={(event) => handleClose(event)}
						/>
					</div>
				</div>
				{children}
			</div>
		</ReactModal>
	);
};

export default Modal;
