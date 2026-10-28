import type {ButtonHTMLAttributes, MouseEventHandler} from "react";

import {translate} from "../../helpers/i18n";

function CloseButton({
	onClose,
	className = "",
	...attrs
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	onClose?: MouseEventHandler<HTMLButtonElement>;
}) {
	return (
		<button
			type="button"
			className={`ms3-button ms3-feature-selection-info__close-button ${className}`}
			onClick={onClose}
			{...attrs}
		>
			<span className="ms3-visuallyhidden">
				{translate("ui.feature-selection-info.close")}
			</span>
		</button>
	);
}

export default CloseButton;
