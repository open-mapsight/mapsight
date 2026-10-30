export function DemoNotice() {
	return (
		<aside className="demo-notice" aria-label="Demohinweis">
			<strong>Fiktive Demo-Website im Mapsight-Showcase.</strong> Keine
			reale Behörde, kein reales Unternehmen. Alle Servicestellen, Namen,
			Öffnungszeiten und Zugangsangaben sind erfunden. Das Kartengebiet
			wurde ausschließlich wegen der verfügbaren Kartenabdeckung gewählt.
			Keine Empfehlung oder Zertifizierung.{" "}
			<a href="/scenarios/index.html">Alle Szenarien</a>
		</aside>
	);
}
export function AboutDemo({
	features,
	gaps,
}: {
	features: string[];
	gaps: string[];
}) {
	return (
		<section className="demo-about" aria-labelledby="about-demo">
			<h2 className="kern-heading-medium" id="about-demo">
				Über diese Demo
			</h2>
			<p>
				Native Einbettung von Mapsight in eine eigenständige Hostseite.
				Fiktive Demodaten, keine Live-Auskunft.
			</p>
			<h3 className="kern-heading-small">Gezeigte Funktionen</h3>
			<ul className="kern-list kern-list--bullet">
				{features.map((text) => (
					<li key={text}>{text}</li>
				))}
			</ul>
			<h3 className="kern-heading-small">Sichtbare Produktgrenzen</h3>
			<ul className="kern-list kern-list--bullet">
				{gaps.map((text) => (
					<li key={text}>{text}</li>
				))}
			</ul>
			<p>
				Gebaut mit KERN-CSS · @kern-ux/native 2.8.2 ·{" "}
				<a href="/vendor/kern/EUPL-1.2.md">EUPL-1.2</a> ·{" "}
				<a href="https://gitlab.opencode.de/kern-ux/kern-ux-plain">
					Quellcode
				</a>{" "}
				· <a href="/vendor/kern/NOTICE.txt">Hinweise</a>. Fira Sans:{" "}
				<a href="/vendor/kern/FiraSans-OFL.txt">SIL OFL-1.1</a>. Eigene
				Demo-Inhalte: MIT. Kartengrundlage:{" "}
				<a href="https://www.openstreetmap.org/copyright">
					© OpenStreetMap-Mitwirkende, ODbL
				</a>
				.
			</p>
			<p>
				Fiktive Demo-Website, keine offizielle Website. Keine Verbindung
				zum KERN-Projekt oder zu dessen Trägern, keine Empfehlung oder
				Zertifizierung. Die Verwendung von KERN-CSS ist keine Aussage
				zur Barrierefreiheit dieser Website.
			</p>
			<a href="/privacy">Datenschutz im Showcase</a>
		</section>
	);
}
