import {Link, NavLink, Outlet, useLocation} from "react-router-dom";

import {DemoNav} from "./demo-nav.tsx";
import {IconsNav} from "./icons-nav.tsx";

const navItems = [
	{to: "/", label: "Home", end: true},
	{to: "/ui/combined-list", label: "Demos", end: false},
	{to: "/count-aggregator", label: "Count aggregator", end: false},
	{to: "/icons", label: "Icons", end: false},
] as const;

export function DemosLayout() {
	const location = useLocation();
	const showDemoNav = location.pathname.startsWith("/ui");
	const showIconsNav = location.pathname.startsWith("/icons");
	const isIconEditor = location.pathname === "/icons";
	const useFixedHeightLayout = showDemoNav || isIconEditor;

	const shellClassName = [
		"demos",
		useFixedHeightLayout ? "demos--fixed-height" : "",
	]
		.filter(Boolean)
		.join(" ");

	const mainClassName = [
		"demos__main",
		showDemoNav ? "demos__main--embed" : "",
		isIconEditor ? "demos__main--icon-editor" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={shellClassName}>
			<header className="demos__header">
				<div className="demos__header-inner">
					<Link to="/" className="demos__brand">
						<strong>Developer demos</strong>
					</Link>
					<nav className="demos__nav" aria-label="Main">
						<ul>
							{navItems.map(({to, label, ...rest}) => (
								<li key={to}>
									<NavLink
										to={to}
										end={"end" in rest ? rest.end : false}
										className={({isActive}) =>
											isActive
												? "demos__nav-link is-active"
												: "demos__nav-link"
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
			<footer className="demos__footer">
				<div className="demos__footer-inner">
					<span>
						Developer demos, built from the latest main branch.{" "}
						<a href="https://showcase.open-mapsight.org">
							Curated showcase
						</a>
					</span>
					<nav aria-label="Legal">
						<a href="https://github.com/open-mapsight/mapsight">
							GitHub
						</a>
						<a href="https://open-mapsight.org/legal/">
							Legal notice
						</a>
						<a href="https://open-mapsight.org/privacy/">
							Privacy policy
						</a>
					</nav>
				</div>
			</footer>
		</div>
	);
}
