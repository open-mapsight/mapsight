"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

export function AppNav() {
	const pathname = usePathname();

	return (
		<nav aria-label="Main">
			<ul className="app-layout__nav">
				<li>
					<Link
						href="/"
						aria-current={pathname === "/" ? "page" : undefined}
					>
						Map
					</Link>
				</li>
				<li>
					<Link
						href="/about"
						aria-current={
							pathname === "/about" ? "page" : undefined
						}
					>
						About
					</Link>
				</li>
			</ul>
		</nav>
	);
}
