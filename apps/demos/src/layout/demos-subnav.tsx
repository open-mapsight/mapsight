import {NavLink} from "react-router-dom";

export type SubnavItem = {
	to: string;
	label: string;
	end?: boolean;
};

export function DemosSubnav({
	label,
	items,
}: {
	label: string;
	items: readonly SubnavItem[];
}) {
	return (
		<nav className="demos__subnav" aria-label={label}>
			<div className="demos__subnav-inner">
				<ul>
					{items.map(({to, label: itemLabel, end = true}) => (
						<li key={to}>
							<NavLink
								to={to}
								end={end}
								className={({isActive}) =>
									isActive
										? "demos__subnav-link is-active"
										: "demos__subnav-link"
								}
							>
								{itemLabel}
							</NavLink>
						</li>
					))}
				</ul>
			</div>
		</nav>
	);
}
