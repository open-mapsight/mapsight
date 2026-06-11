import {NavLink} from "react-router-dom";

export type SubnavItem = {
	to: string;
	label: string;
	end?: boolean;
};

export function ShowcaseSubnav({
	label,
	items,
}: {
	label: string;
	items: readonly SubnavItem[];
}) {
	return (
		<nav className="showcase__subnav" aria-label={label}>
			<div className="showcase__subnav-inner">
				<ul>
					{items.map(({to, label: itemLabel, end = true}) => (
						<li key={to}>
							<NavLink
								to={to}
								end={end}
								className={({isActive}) =>
									isActive
										? "showcase__subnav-link is-active"
										: "showcase__subnav-link"
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
