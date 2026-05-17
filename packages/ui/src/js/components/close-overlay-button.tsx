import type {ComponentPropsWithoutRef, FC, MouseEvent} from "react";

import {translate} from "../helpers/i18n";

export type Props = {
	label?: string;
	onClose?: (event: MouseEvent<HTMLButtonElement>) => void;
} & ComponentPropsWithoutRef<"button">;

const CloseOverlayButton: FC<Props> = ({
	label = translate("close"),
	onClose,
	...attributes
}) => {
	return (
		<button
			className="ms3-dialog-close-button"
			type="button"
			onClick={onClose}
			{...attributes}
		>
			<span className="ms3-visuallyhidden">{label}</span>
		</button>
	);
};

export default CloseOverlayButton;
