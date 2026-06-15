import {type ReactElement, type ReactNode, memo} from "react";

export const Section = memo(function Section({
	title,
	titleClassName = "msca:mb-2 msca:text-base msca:font-bold",
	children,
}: {
	title: string;
	titleClassName?: string;
	children?: ReactNode;
}): ReactElement {
	return (
		<div className="msca:mb-6">
			<h4 className={titleClassName}>{title}</h4>
			<fieldset className="msca:ml-5">
				<legend className="msca:sr-only">{title}</legend>
				<div className="msca:space-y-2">{children}</div>
			</fieldset>
		</div>
	);
});
