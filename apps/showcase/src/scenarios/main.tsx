import {createRoot} from "react-dom/client";

import {AboutDemo, DemoNotice} from "./shared/about-demo.tsx";

import "./shared/host.css";

createRoot(document.getElementById("root")!).render(
	<>
		<DemoNotice />
		<main className="host">
			<a href="/">Zum Mapsight-Showcase</a>
			<h1 className="kern-heading-x-large">Mapsight im Einsatz</h1>
			<p>
				Wie fügt sich eine Karte in eine konkrete Aufgabe ein? Diese
				fiktiven Hostseiten zeigen Mapsight mit eigener Typografie,
				Seitengestaltung und lokalen Beispieldaten.
			</p>
			<article className="scenario-card">
				<p>01 · Öffentliche Verwaltung</p>
				<h2 className="kern-heading-large">
					Musterstadt · Bürgerservice
				</h2>
				<p>
					Finden Sie eine Servicestelle für Ihr Anliegen und prüfen
					Sie Öffnungszeiten und stufenlosen Zugang.
				</p>
				<a
					className="kern-btn kern-btn--primary"
					href="/scenarios/verwaltung/index.html"
				>
					<span className="kern-label">Bürgerservice öffnen</span>
				</a>
			</article>
			<AboutDemo
				features={[
					"Karte, Filter und Liste in einer eigenständigen Hostseite",
					"KERN-Typografie und lokal gehostete Schriften",
				]}
				gaps={[
					"Weitere Zielgruppenszenarien folgen separat.",
					"Alle Auskünfte sind fiktiv und dienen nur der Demonstration.",
				]}
			/>
		</main>
	</>,
);
