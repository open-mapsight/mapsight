import type {
	AnchorHTMLAttributes,
	ElementType,
	ReactElement,
	ReactNode,
} from "react";

export type OutboundLinkProps = {
	href: string;
	as?: ElementType;
	className?: string;
	children?: ReactNode;
	label?: ReactNode;
	icon?: ReactNode;
	rel?: string;
	target?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "rel" | "target">;

/**
 * Real `<a>` for leaving the current document (website, maps, related hops).
 * Defaults: new tab, `rel="external noreferrer"`. Renders nothing without href.
 */
export default function OutboundLink({
	href,
	as: T = "a",
	className,
	children,
	label,
	icon,
	rel = "external noreferrer",
	target = "_blank",
	...rest
}: OutboundLinkProps): ReactElement | null {
	if (!href) {
		return null;
	}

	const classNames = ["ms3-outbound-link", className]
		.filter(Boolean)
		.join(" ");

	return (
		<T
			href={href}
			className={classNames}
			rel={rel}
			target={target}
			{...rest}
		>
			{icon ? (
				<span className="ms3-outbound-link__icon">{icon}</span>
			) : null}
			{label ?? children}
		</T>
	);
}
