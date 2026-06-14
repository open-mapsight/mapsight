import type {ReactNode} from "react";
import {memo, useCallback, useState} from "react";

import {FocusTrap} from "focus-trap-react";

import {translate} from "../../helpers/i18n";

export type FilterToggleControlProps = {
	className?: string;
	buttonClassName: string;
	buttonActiveClassName: string;
	title: string;
	children: ReactNode;
};

function FilterToggleControl({
	className,
	buttonClassName,
	buttonActiveClassName,
	title,
	children,
}: FilterToggleControlProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handleClose = useCallback(() => setIsOpen(false), []);
	const handleOpen = useCallback(() => setIsOpen(true), []);

	let rootClassName = `ms3-filter-toggle-control ms3-filter-toggle-control--${
		isOpen ? "active" : "inactive"
	}`;
	if (className) {
		rootClassName += ` ${className}`;
	}

	const button = (open: boolean) => (
		<button
			type="button"
			className={`ms3-filter-button ${
				open ? buttonActiveClassName : buttonClassName
			}`}
			onClick={open ? handleClose : handleOpen}
			title={title}
			aria-expanded={open}
		>
			<i>{open ? translate("close") : translate("open")}</i>
		</button>
	);

	return (
		<div className={rootClassName}>
			{isOpen ? (
				<FocusTrap
					focusTrapOptions={{
						clickOutsideDeactivates: true,
						onDeactivate: handleClose,
					}}
				>
					<div className="ms3-filter-toggle-control__content">
						{button(true)}
						<div className="ms3-filter-toggle-control__panel">
							{children}
						</div>
					</div>
				</FocusTrap>
			) : (
				button(false)
			)}
		</div>
	);
}

export default memo(FilterToggleControl);
