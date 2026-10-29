import {type ReactNode, useState} from "react";
import {Link} from "react-router-dom";

import inkLogo from "../brand/horizontal-ink.svg";
import paperLogo from "../brand/horizontal-paper.svg";
import brandTokens from "../brand/tokens.css?inline";

const scopedBrandTokens = brandTokens.replaceAll(":root", ".msb-shell");
const navItems = [
	{href: "/", label: "Home", activePath: "/"},
	{
		href: "/scenarios/index.html",
		label: "Scenarios",
		activePath: "/scenarios",
	},
	{href: "/ui/combined-list", label: "Demos", activePath: "/ui"},
	{
		href: "/count-aggregator",
		label: "Count aggregator",
		activePath: "/count-aggregator",
	},
	{href: "/icons", label: "Icons", activePath: "/icons"},
] as const;

type ShellLinkProps = {
	href: string;
	nativeNavigation: boolean;
	className?: string;
	"aria-current"?: "page";
	children: ReactNode;
};

function ShellLink({
	href,
	nativeNavigation,
	children,
	...props
}: ShellLinkProps) {
	return nativeNavigation || href.endsWith(".html") ? (
		<a href={href} {...props}>
			{children}
		</a>
	) : (
		<Link to={href} {...props}>
			{children}
		</Link>
	);
}

/** Shared brand frame; standalone HTML pages navigate to the SPA with native links. */
export function ShowcaseFrame({
	children,
	pathname,
	subnav,
	fixedHeight = false,
	mainClassName = "",
	nativeNavigation = false,
}: {
	children: ReactNode;
	pathname: string;
	subnav?: ReactNode;
	fixedHeight?: boolean;
	mainClassName?: string;
	nativeNavigation?: boolean;
}) {
	const [darkFrame, setDarkFrame] = useState(
		() =>
			typeof window !== "undefined" &&
			window.matchMedia?.("(prefers-color-scheme: dark)").matches ===
				true,
	);

	return (
		<div
			className={`showcase msb-shell${fixedHeight ? " showcase--fixed-height" : ""}`}
			data-theme={darkFrame ? "dark" : "light"}
		>
			<style>{scopedBrandTokens}</style>
			<a className="msb-skip" href="#showcase-content">
				Skip to content
			</a>
			<header className="showcase__header msb-site-header">
				<div className="msb-site-header__inner">
					<div className="msb-site-header__mast">
						<ShellLink
							href="/"
							nativeNavigation={nativeNavigation}
							className="showcase__brand msb-site-header__brand"
						>
							<img
								className="msb-site-header__logo"
								src={darkFrame ? paperLogo : inkLogo}
								alt="Mapsight"
								width="186"
								height="48"
							/>
							<span className="msb-site-header__descriptor">
								Showcase
							</span>
						</ShellLink>
						<div className="msb-site-header__tools">
							<button
								className="msb-site-header__theme"
								type="button"
								aria-pressed={darkFrame}
								onClick={() => setDarkFrame(!darkFrame)}
							>
								Dark mode
							</button>
						</div>
					</div>
					<nav
						className="showcase__nav msb-site-header__nav"
						aria-label="Main"
					>
						<ul>
							{navItems.map(({href, label, activePath}) => {
								const active =
									pathname === activePath ||
									(activePath !== "/" &&
										pathname.startsWith(`${activePath}/`));
								return (
									<li key={href}>
										<ShellLink
											href={href}
											nativeNavigation={nativeNavigation}
											aria-current={
												active ? "page" : undefined
											}
											className="showcase__nav-link"
										>
											{label}
										</ShellLink>
									</li>
								);
							})}
							<li>
								<a
									className="showcase__nav-link"
									href="https://open-mapsight.org"
								>
									Project website ↗
								</a>
							</li>
						</ul>
					</nav>
				</div>
			</header>
			{subnav}
			<main
				id="showcase-content"
				tabIndex={-1}
				className={`showcase__main ${mainClassName}`.trim()}
			>
				{children}
			</main>
			<footer className="showcase__footer">
				<div className="showcase__footer-inner">
					<div>
						<p>Accessibility is a design goal; audit planned.</p>
						<p>
							The marks are not open source; code and source
							licences apply separately.
						</p>
					</div>
					<nav aria-label="Resources and legal">
						<a href="https://github.com/open-mapsight/mapsight/blob/main/docs/TRADEMARK.md">
							Trademark policy
						</a>
						<a href="https://github.com/open-mapsight/mapsight/blob/main/docs/development/CONTRIBUTING.md">
							Community / contributing
						</a>
						<a href="mailto:contact@open-mapsight.org">Contact</a>
						<ShellLink
							href="/imprint"
							nativeNavigation={nativeNavigation}
						>
							Imprint
						</ShellLink>
						<ShellLink
							href="/privacy"
							nativeNavigation={nativeNavigation}
						>
							Privacy
						</ShellLink>
					</nav>
				</div>
			</footer>
		</div>
	);
}
