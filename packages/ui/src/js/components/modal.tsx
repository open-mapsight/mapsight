import type {ElementType, KeyboardEvent, MouseEvent, ReactNode} from "react";
import type {Props as ReactModalProps} from "react-modal";
import ReactModal from "react-modal";

import {
	Heading,
	HeadingContent,
	HeadingLevel,
	useHeadingElement,
} from "../headings";
import CloseOverlayButton from "./close-overlay-button";

export type Props = ReactModalProps & {
	closeLabel?: string;
	headline: ReactNode;
	headlineAs?: ElementType;
};

const Modal = ({
	children,
	closeLabel,
	headline,
	headlineAs,
	...props
}: Props) => {
	const Headline = useHeadingElement("dialogTitle", headlineAs, {
		level: 2,
	});
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
			<HeadingLevel level={2}>
				<div className="ms3-modal__inner ms3-modal__inner--search">
					<div className="ms3-modal__header">
						<Heading as={Headline} className="ms3-modal__headline">
							{headline}
						</Heading>
						<div className="ms3-modal__close">
							<CloseOverlayButton
								label={closeLabel}
								onClose={(event) => handleClose(event)}
							/>
						</div>
					</div>
					<HeadingContent headingAs={Headline}>
						{children}
					</HeadingContent>
				</div>
			</HeadingLevel>
		</ReactModal>
	);
};

export default Modal;
