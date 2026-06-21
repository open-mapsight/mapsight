import type {ReactNode} from "react";
import {memo, useCallback, useRef, useState} from "react";
import {mergeProps, usePress} from "react-aria";

import {FocusTrap} from "focus-trap-react";

import {translate} from "../../helpers/i18n";
import useOverlayDismiss from "../../hooks/useOverlayDismiss";

export type FilterToggleControlProps = {
	className?: string;
	buttonClassName: string;
	buttonActiveClassName: string;
	title: string;
	children: ReactNode;
};

const focusTrapOptions = {
	clickOutsideDeactivates: false,
	escapeDeactivates: false,
} as const;

function FilterToggleControl({
	className,
	buttonClassName,
	buttonActiveClassName,
	title,
	children,
}: FilterToggleControlProps) {
	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	const handleClose = useCallback(() => setIsOpen(false), []);
	const handleToggle = useCallback(() => {
		setIsOpen((open) => !open);
	}, []);

	const {pressProps} = usePress({
		onPress: handleToggle,
	});

	useOverlayDismiss({
		isActive: isOpen,
		onDismiss: handleClose,
		excludeRefs: [triggerRef, panelRef],
	});

	let rootClassName = `ms3-filter-toggle-control ms3-filter-toggle-control--${
		isOpen ? "active" : "inactive"
	}`;
	if (className) {
		rootClassName += ` ${className}`;
	}

	return (
		<div className={rootClassName}>
			<button
				{...mergeProps(pressProps, {
					type: "button" as const,
					className: `ms3-filter-button ${
						isOpen ? buttonActiveClassName : buttonClassName
					}`,
					title,
					"aria-expanded": isOpen,
				})}
				ref={triggerRef}
			>
				<i>{isOpen ? translate("close") : translate("open")}</i>
			</button>

			{isOpen ? (
				<FocusTrap focusTrapOptions={focusTrapOptions}>
					<div
						className="ms3-filter-toggle-control__panel"
						ref={panelRef}
					>
						{children}
					</div>
				</FocusTrap>
			) : null}
		</div>
	);
}

export default memo(FilterToggleControl);
