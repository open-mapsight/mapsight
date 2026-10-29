import {createRoot} from "react-dom/client";

import {ShowcaseFrame} from "../layout/showcase-frame.tsx";

import "../global.css";

const scenarios = [
	{
		number: "01",
		category: "Öffentliche Verwaltung",
		title: "Die richtige Servicestelle finden",
		host: "Musterstadt · Bürgerservice",
		description:
			"Ein Anliegen auswählen, nach stufenlosem Zugang filtern und Öffnungszeiten einer Servicestelle prüfen.",
		tasks: ["Anliegen & Filter", "Karte & Liste", "Öffnungszeiten"],
		href: "/scenarios/verwaltung/index.html",
		link: "Bürgerservice öffnen",
	},
	{
		number: "02",
		category: "Tourismus",
		title: "Orte für den nächsten Ausflug entdecken",
		host: "Fiktive Tourismus-Website",
		description:
			"Ausflugsorte auf der Karte entdecken, nach Kategorien eingrenzen und einen ausgewählten Ort per Link teilen.",
		tasks: ["Orte entdecken", "Kategorien", "Ort teilen"],
		href: "/scenarios/tourismus/index.html",
		link: "Tourismus-Szenario öffnen",
	},
	{
		number: "03",
		category: "Verkehr",
		title: "Verkehrslage und Parkmöglichkeiten prüfen",
		host: "Fiktives Verkehrsportal",
		description:
			"Simulierte Verkehrsmeldungen ansehen, Parkmöglichkeiten vergleichen und die angezeigten Kennzahlen einordnen.",
		tasks: ["Verkehrsmeldungen", "Parken", "Simulierte Kennzahlen"],
		href: "/scenarios/verkehr/index.html",
		link: "Verkehrs-Szenario öffnen",
	},
] as const;

createRoot(document.getElementById("root")!).render(
	<ShowcaseFrame
		pathname="/scenarios/index.html"
		mainClassName="showcase__main--brand"
		nativeNavigation
	>
		<div className="showcase-page scenario-overview msb-content">
			<header className="scenario-overview__intro">
				<p className="msb-eyebrow">
					Scenarios / Fictional host websites
				</p>
				<h1>Maps within a real task.</h1>
				<p className="msb-intro">
					Choose a task and try Mapsight in a host site with its own
					identity, layout and workflow. All hosts are fictional; each
					page explains its sample data and sources. Tourism is also
					available in English.
				</p>
				<p className="scenario-overview__notice">
					Work in progress · No live service or traffic information.
					The host websites are fictional, not customer references or
					official services.
				</p>
			</header>
			<section
				aria-label="Choose a scenario"
				className="scenario-overview__list"
				lang="de"
			>
				{scenarios.map((scenario) => (
					<article
						className="scenario-overview__card"
						key={scenario.href}
					>
						<div className="scenario-overview__category">
							<span aria-hidden="true">{scenario.number}</span>
							<p>{scenario.category}</p>
						</div>
						<div className="scenario-overview__task">
							<p className="scenario-overview__host">
								{scenario.host}
							</p>
							<h2>{scenario.title}</h2>
							<p>{scenario.description}</p>
							<ul aria-label="Aufgaben in diesem Szenario">
								{scenario.tasks.map((task) => (
									<li key={task}>{task}</li>
								))}
							</ul>
							<a href={scenario.href}>{scenario.link} →</a>
						</div>
					</article>
				))}
			</section>
			<aside
				className="scenario-overview__about"
				aria-labelledby="scenario-about"
			>
				<h2 id="scenario-about">What these examples show</h2>
				<p>
					Mapsight provides the map interactions, filters and feature
					lists. Each host site supplies its own content and visual
					identity. Demonstration data is not a recommendation or a
					certification. Accessibility is a design goal; an audit is
					planned.
				</p>
				<a href="/ui/combined-list">Explore individual UI patterns →</a>
			</aside>
		</div>
	</ShowcaseFrame>,
);
