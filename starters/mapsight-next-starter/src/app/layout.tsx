import type {ReactNode} from "react";

import type {Metadata} from "next";

import {AppNav} from "@/app/ui/app-nav";
import {ReactModalAppElement} from "@/app/ui/react-modal-app-element";

import "./globals.scss";

export const metadata: Metadata = {
	title: "Mapsight Next starter",
	description: "Minimal Next.js App Router integration template",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="min-h-full antialiased">
				<ReactModalAppElement appElementId="mapsight-app-root">
					<div id="mapsight-app-root" className="app-layout">
						<header className="app-layout__header">
							<AppNav />
						</header>
						<main className="app-layout__main">{children}</main>
					</div>
				</ReactModalAppElement>
			</body>
		</html>
	);
}
