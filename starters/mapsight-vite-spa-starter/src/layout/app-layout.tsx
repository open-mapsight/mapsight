import {NavLink, Outlet} from "react-router-dom";

export function AppLayout() {
	return (
		<div className="app-layout">
			<header className="app-layout__header">
				<nav aria-label="Main">
					<ul className="app-layout__nav">
						<li>
							<NavLink end to="/">
								Map
							</NavLink>
						</li>
						<li>
							<NavLink to="/about">About</NavLink>
						</li>
					</ul>
				</nav>
			</header>
			<main className="app-layout__main">
				<Outlet />
			</main>
		</div>
	);
}
