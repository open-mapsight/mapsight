import {useState} from "react";
import {Link, NavLink, Outlet, useLocation} from "react-router-dom";

import inkLogo from "../brand/horizontal-ink.svg";
import paperLogo from "../brand/horizontal-paper.svg";
import brandTokens from "../brand/tokens.css?inline";
import {DemoNav} from "./demo-nav.tsx";
import {IconsNav} from "./icons-nav.tsx";

const scopedBrandTokens = brandTokens.replaceAll(":root", ".msb-shell");

const navItems = [
	{to: "/", label: "Home", end: true},
	{to: "/ui/combined-list", label: "Demos", end: false},
	{to: "/count-aggregator", label: "Count aggregator", end: false},
	{to: "/icons", label: "Icons", end: false},
] as const;

export function ShowcaseLayout() {
	const location = useLocation();
	const [darkFrame, setDarkFrame] = useState(false);
	const showDemoNav = location.pathname.startsWith("/ui");
	const showIconsNav = location.pathname.startsWith("/icons");
	const isIconEditor = location.pathname === "/icons";
	const useFixedHeightLayout = showDemoNav || isIconEditor;

	const shellClassName = [
		"showcase msb-shell",
		useFixedHeightLayout ? "showcase--fixed-height" : "",
	]
		.filter(Boolean)
		.join(" ");

	const mainClassName = [
		"showcase__main",
		["/", "/imprint", "/privacy"].includes(location.pathname)
			? "showcase__main--brand"
			: "",
		showDemoNav ? "showcase__main--embed" : "",
		isIconEditor ? "showcase__main--icon-editor" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			className={shellClassName}
			data-theme={darkFrame ? "dark" : "light"}
		>
			<style>{scopedBrandTokens}</style>
			<a className="msb-skip" href="#showcase-content">
				Skip to content
			</a>
			<header className="showcase__header">
				<div className="showcase__header-inner">
					<Link to="/" className="showcase__brand">
						<img
							src={darkFrame ? paperLogo : inkLogo}
							alt="Mapsight"
							width="186"
							height="48"
						/>
					</Link>
					<button
						className="msb-theme"
						type="button"
						aria-pressed={darkFrame}
						onClick={() => setDarkFrame(!darkFrame)}
					>
						Dark mode
					</button>
					<nav className="showcase__nav" aria-label="Main">
						<ul>
							{navItems.map(({to, label, ...rest}) => (
								<li key={to}>
									<NavLink
										to={to}
										end={"end" in rest ? rest.end : false}
										className={({isActive}) =>
											isActive
												? "showcase__nav-link is-active"
												: "showcase__nav-link"
										}
									>
										{label}
									</NavLink>
								</li>
							))}
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
			{showDemoNav ? <DemoNav /> : null}
			{showIconsNav ? <IconsNav /> : null}
			<main id="showcase-content" tabIndex={-1} className={mainClassName}>
				<Outlet />
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
						<Link to="/imprint">Imprint</Link>
						<Link to="/privacy">Privacy</Link>
					</nav>
				</div>
			</footer>
		</div>
	);
}
