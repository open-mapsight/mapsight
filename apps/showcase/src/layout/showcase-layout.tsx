import {Link, NavLink, Outlet, useLocation} from "react-router-dom";

import {DemoNav} from "./demo-nav.tsx";
import {IconsNav} from "./icons-nav.tsx";

const navItems = [
	{to: "/", label: "Home", end: true},
	{to: "/ui/combined-list", label: "Demos", end: false},
	{to: "/count-aggregator", label: "Count aggregator", end: true},
	{to: "/icons", label: "Icons", end: false},
] as const;

export function ShowcaseLayout() {
	const location = useLocation();
	const showDemoNav = location.pathname.startsWith("/ui");
	const showIconsNav = location.pathname.startsWith("/icons");
	const isIconEditor = location.pathname === "/icons";
	const useFixedHeightLayout = showDemoNav || isIconEditor;

	const shellClassName = [
		"showcase",
		useFixedHeightLayout ? "showcase--fixed-height" : "",
	]
		.filter(Boolean)
		.join(" ");

	const mainClassName = [
		"showcase__main",
		showDemoNav ? "showcase__main--embed" : "",
		isIconEditor ? "showcase__main--icon-editor" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={shellClassName}>
			<header className="showcase__header">
				<div className="showcase__header-inner">
					<Link to="/" className="showcase__brand">
						<strong>Mapsight</strong>
						<span className="showcase__tagline">Showcase</span>
					</Link>
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
						</ul>
					</nav>
				</div>
			</header>
			{showDemoNav ? <DemoNav /> : null}
			{showIconsNav ? <IconsNav /> : null}
			<main className={mainClassName}>
				<Outlet />
			</main>
			<footer className="showcase__footer">
				<div className="showcase__footer-inner">
					<span>Mapsight showcase</span>
					<nav aria-label="Legal">
						<Link to="/imprint">Imprint</Link>
						<Link to="/privacy">Privacy</Link>
					</nav>
				</div>
			</footer>
		</div>
	);
}
