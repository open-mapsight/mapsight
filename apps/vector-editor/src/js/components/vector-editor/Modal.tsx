import type React from "react";
import {useCallback} from "react";
import ReactModal from "react-modal";

import Icon from "./Icon.tsx";
import VisuallyHidden from "./VisuallyHidden.tsx";

function Modal({
	children,
	title,
	setIsOpen,
	...attributes
}: {
	children: React.ReactNode;
	title: string;
	setIsOpen: (isOpen: boolean) => void;
} & ReactModal.Props) {
	const close = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	return (
		<ReactModal
			onRequestClose={close}
			shouldCloseOnOverlayClick={true}
			className="ms3-vector-editor-modal"
			overlayClassName="ms3-vector-editor-modal-overlay"
			{...attributes}
		>
			<section>
				<header className="ms3-vector-editor-modal__header">
					<h1 className="ms3-vector-editor-modal__title">{title}</h1>

					<button
						type="button"
						className="ms3-vector-editor-modal__close-button"
						onClick={close}
					>
						<Icon name="icon-close" />
						<VisuallyHidden>Fenster schließen</VisuallyHidden>
					</button>
				</header>

				<div className="ms3-vector-editor-modal__header">
					{children}
				</div>
			</section>
		</ReactModal>
	);
}

export default Modal;
