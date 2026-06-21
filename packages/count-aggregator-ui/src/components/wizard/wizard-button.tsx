import {type ButtonHTMLAttributes, type ReactElement} from "react";

import {cn} from "../../lib/utils.js";

const baseButtonClass =
	"msca:rounded msca:border msca:border-(--msca-color-border) msca:bg-(--msca-color-surface) msca:px-3 msca:py-1 msca:text-sm msca:hover:bg-(--msca-color-surface-muted)";

export function WizardButton({
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>): ReactElement {
	return (
		<button
			type="button"
			className={cn(baseButtonClass, className)}
			{...props}
		/>
	);
}

export function WizardPrimaryButton({
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>): ReactElement {
	return (
		<button
			type="submit"
			className={cn(
				"msca:rounded msca:border-0 msca:bg-(--msca-color-primary) msca:px-6 msca:py-2 msca:text-sm msca:text-white msca:hover:bg-(--msca-color-primary-hover)",
				className,
			)}
			{...props}
		/>
	);
}
