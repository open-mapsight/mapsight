import {type HTMLAttributes, forwardRef, useEffect, useRef} from "react";
import {createRoot} from "react-dom/client";
import {useSelector} from "react-redux";

import DistanceLabel from "@mapsight/ui/components/distance-label";
import FeatureList from "@mapsight/ui/components/feature-list";
import FeatureSelectionInfo from "@mapsight/ui/components/feature-selection-info/index";
import Instance from "@mapsight/ui/components/instance";
import Wrapper from "@mapsight/ui/components/layout/wrapper";
import Map from "@mapsight/ui/components/map";
import Attribution from "@mapsight/ui/components/map-overlay/attribution";
import ZoomButtons from "@mapsight/ui/components/map-overlay/zoom-buttons";
import MapWrapper from "@mapsight/ui/components/map-wrapper";
import TagSwitcher from "@mapsight/ui/components/tag-switcher";
import {selectedFeatureSelector} from "@mapsight/ui/store/selectors";
import type {MapsightUiFeature} from "@mapsight/ui/types";

import {categories, en} from "./content.ts";
import landscape from "./landscape.svg";
import {
	baseMapsightConfig,
	createOptions,
	styleFunction,
} from "./mapsight-config.tsx";

import "./host.scss";

/** itemAs receives the real FeatureList item, its selection button and focus props. */
const PlaceCard = forwardRef<
	HTMLLIElement,
	HTMLAttributes<HTMLLIElement> & {feature: MapsightUiFeature}
>(function PlaceCard({feature, children, className, ...attributes}, ref) {
	const properties = feature.properties as {
		category?: number;
		summary?: string;
	};
	const category = Number(properties.category);
	return (
		<li
			{...attributes}
			ref={ref}
			className={`${className} place-card place-card--${category}`}
		>
			<div className="place-card__picture" aria-hidden="true">
				<svg viewBox="0 0 400 150" focusable="false">
					<circle cx="315" cy="40" r="28" className="scene-sun" />
					<path
						d="M0 124Q100 58 200 104T400 88V150H0Z"
						className="scene-land"
					/>
					{category === 1 ? (
						<g className="scene-building">
							<path
								d="M170 135V53M230 135V68"
								stroke="currentColor"
								strokeWidth="7"
							/>
							<path
								d="M170 20C110 25 111 92 170 104C229 92 231 26 170 20ZM230 41C183 45 183 100 230 109C277 99 277 47 230 41Z"
								fill="currentColor"
							/>
						</g>
					) : category === 3 ? (
						<g className="scene-building" fill="currentColor">
							<path d="M112 47H280V135H112Z" />
							<path d="M106 37H286V52H106Z" />
							<path
								d="M131 54V117L170 88ZM261 54V117L222 88Z"
								className="scene-cutout"
							/>
							<path
								d="M185 84H207V135H185Z"
								className="scene-cutout"
							/>
						</g>
					) : category === 2 ? (
						<g className="scene-building" fill="currentColor">
							<path d="M123 135V60L173 25L222 60V135ZM215 135V77L249 49L282 77V135Z" />
							<path
								d="M145 71H162V91H145ZM183 71H200V91H183ZM237 89H254V108H237ZM166 108H186V135H166Z"
								className="scene-cutout"
							/>
						</g>
					) : (
						<g className="scene-building" fill="currentColor">
							<path d="M111 60L200 17L289 60ZM115 126H285V137H115ZM128 72H143V122H128ZM170 72H185V122H170ZM212 72H227V122H212ZM254 72H269V122H254Z" />
						</g>
					)}
				</svg>
				<span>{categories[category]}</span>
			</div>
			{children}
			<p className="place-card__summary">{properties.summary}</p>
		</li>
	);
});

function PlaceDetails() {
	const feature = useSelector(selectedFeatureSelector);
	const ref = useRef<HTMLElement>(null);
	useEffect(() => {
		if (feature)
			ref.current?.scrollIntoView({
				block: "nearest",
				behavior: "instant",
			});
	}, [feature]);
	return (
		<section
			id="place-details"
			ref={ref}
			className="place-details"
			aria-label={en ? "Place details" : "Details zum Ort"}
		>
			{feature ? (
				<>
					<p className="eyebrow">
						{en ? "Your next stop" : "Dein nächster Stopp"}
					</p>
					<FeatureSelectionInfo
						feature={feature}
						enableKeyboardControl={true}
						headlineAs="h3"
						landmark={false}
					/>
					<p className="outbound-note">
						{en
							? "Directions open an external website or your device's map app. Only following the link sends you there."
							: "Die Route öffnet eine externe Website oder deine Karten-App. Erst wenn du dem Link folgst, wechselst du dorthin."}
					</p>
				</>
			) : (
				<div className="place-details__empty">
					<span aria-hidden="true">✳</span>
					<h3>
						{en
							? "A place catches your eye?"
							: "Ein Ort macht dich neugierig?"}
					</h3>
					<p>
						{en
							? "Choose a card or a map marker. Read the details here, then share the place with someone you'd like to bring along."
							: "Wähle eine Karte oder einen Kartenpunkt. Hier liest du mehr und kannst den Ort mit deiner Reisebegleitung teilen."}
					</p>
				</div>
			)}
		</section>
	);
}

function LanguageLink() {
	const target = new URL(
		en ? "./index.html" : "./en.html",
		window.location.href,
	);
	// A second document initializes both the host and Mapsight in the new language.
	target.search = window.location.search;
	return (
		<a
			className="language-link"
			href={target.pathname + target.search}
			hrefLang={en ? "de" : "en"}
			lang={en ? "de" : "en"}
			aria-label={
				en
					? "Deutsch – deutsche Version öffnen"
					: "Open English version"
			}
		>
			{en ? "Deutsch" : "English"} <span aria-hidden="true">↗</span>
		</a>
	);
}

function TourismHost() {
	return (
		<>
			<a className="skip-link" href="#discover">
				{en ? "Skip to places" : "Direkt zu den Orten"}
			</a>
			<aside
				className="demo-notice"
				aria-label={en ? "Demo notice" : "Demohinweis"}
			>
				<strong>
					{en
						? "Fictional tourism host · Sample data"
						: "Fiktiver Tourismushost · Beispieldaten"}
				</strong>
				<span>
					{en
						? "8 real places from a dated OSM extract. No travel booking or current visitor information."
						: "8 reale Orte aus einem datierten OSM-Auszug. Keine Reisebuchung oder aktuelle Besuchsinformation."}
				</span>
				<a href="/scenarios/index.html">
					{en ? "All scenarios" : "Alle Szenarien"}{" "}
					<span aria-hidden="true">↗</span>
				</a>
			</aside>
			<div className="tourism-host">
				<header className="host-header">
					<a
						className="wordmark"
						href={en ? "./en.html" : "./index.html"}
					>
						<span className="wordmark__symbol" aria-hidden="true">
							m<span>✳</span>
						</span>
						<span>
							Musterland
							<small>
								{en
									? "Tourism · a fictional region"
									: "Tourismus · eine fiktive Region"}
							</small>
						</span>
					</a>
					<nav
						aria-label={en ? "Main navigation" : "Hauptnavigation"}
					>
						<a href="#discover">{en ? "Discover" : "Entdecken"}</a>
						<a href="#about-demo">
							{en ? "About this demo" : "Über die Demo"}
						</a>
						<LanguageLink />
					</nav>
				</header>
				<main>
					<section className="hero" aria-labelledby="hero-title">
						<div className="hero__copy">
							<p className="eyebrow">
								{en
									? "A weekend, at your pace"
									: "Ein Wochenende. In deinem Tempo."}
							</p>
							<h1 id="hero-title">
								{en ? (
									<>
										A little escape.
										<br />
										<em>A world nearby.</em>
									</>
								) : (
									<>
										Mal kurz raus.
										<br />
										<em>Ganz nah dran.</em>
									</>
								)}
							</h1>
							<p className="hero__description">
								{en
									? "A little culture, a patch of green, a new perspective. Find a place for your next unhurried day."
									: "Ein bisschen Kultur, ein Stück Grün, ein neuer Blick. Finde einen Ort für deinen nächsten Tag ohne Eile."}
							</p>
							<a className="discover-link" href="#discover">
								{en
									? "Find your next stop"
									: "Finde deinen nächsten Stopp"}
								<span aria-hidden="true">↓</span>
							</a>
						</div>
						<div className="hero__art">
							<img
								src={landscape}
								alt=""
								width="640"
								height="520"
							/>
							<p>
								{en
									? "Room for small discoveries."
									: "Platz für kleine Entdeckungen."}
							</p>
						</div>
						<div className="hero__folio">
							<span>
								01 —{" "}
								{en
									? "The art of taking a break"
									: "Die Kunst der kleinen Auszeit"}
							</span>
							<span>
								{en
									? "A local field guide"
									: "Ein kleiner Entdeckeratlas"}
							</span>
						</div>
					</section>
					<section
						id="discover"
						aria-labelledby="discover-title"
						className="discover"
					>
						<div className="section-intro">
							<div>
								<p className="eyebrow">
									{en
										? "Follow your curiosity"
										: "Der Neugier nach"}
								</p>
								<h2 id="discover-title">
									{en
										? "What feels like your kind of day?"
										: "Worauf hast du heute Lust?"}
								</h2>
							</div>
							<p>
								{en
									? "Choose a category, compare locations, and open a place. The list searches these eight places locally."
									: "Wähle eine Kategorie, vergleiche die Lage und öffne einen Ort. Die Liste durchsucht diese acht Orte lokal."}
							</p>
						</div>
						<Instance
							baseMapsightConfig={baseMapsightConfig}
							createOptions={createOptions}
							styleFunction={styleFunction}
						>
							<Wrapper className="tourism-map">
								<div className="category-filter">
									<TagSwitcher />
								</div>
								<p className="map-hint">
									{en
										? "Tip: zoom in to separate nearby places. Use Tab to reach controls and the place cards."
										: "Tipp: Vergrößere die Karte, um nahe Orte zu trennen. Mit Tab erreichst du die Bedienung und die Ortskarten."}{" "}
									<a href="#places">
										{en
											? "Skip map to list"
											: "Karte überspringen: zur Liste"}{" "}
										↓
									</a>
								</p>
								<section
									className="map-section"
									aria-label={
										en
											? "Map of selected places"
											: "Karte der ausgewählten Orte"
									}
								>
									<MapWrapper>
										<Map />
										<div className="map-zoom">
											<ZoomButtons />
										</div>
										<Attribution />
									</MapWrapper>
								</section>
								<div id="places" className="places-layout">
									<section
										className="places-results"
										aria-labelledby="places-title"
									>
										<p className="eyebrow">
											{en
												? "Your shortlist starts here"
												: "Hier beginnt deine kleine Auszeit"}
										</p>
										<h3 id="places-title">
											{en
												? "Places to linger"
												: "Orte zum Bleiben"}
										</h3>
										<p className="distance-note">
											{en
												? "Sort by straight-line distance from an example starting point, or your location after permission. This does not calculate a route."
												: "Sortiere nach Luftlinie ab einem Beispiel-Startpunkt oder nach Freigabe ab deinem Standort. Das berechnet keine Route."}
										</p>
										<FeatureList
											itemAs={PlaceCard}
											itemDistanceLabelAs={DistanceLabel}
											enableKeyboardControl={true}
										/>
									</section>
									<PlaceDetails />
								</div>
							</Wrapper>
						</Instance>
					</section>
					<section
						id="about-demo"
						className="about-demo"
						aria-labelledby="about-title"
					>
						<div>
							<p className="eyebrow">
								{en
									? "Behind the example"
									: "Hinter dem Beispiel"}
							</p>
							<h2 id="about-title">
								{en
									? "A fictional host. A working map."
									: "Fiktiver Host. Funktionierende Karte."}
							</h2>
							<p>
								{en
									? "This independently designed host demonstrates native Mapsight composition: category filters, local list search, distance sorting, marker clustering, selectable cards, place details and shareable feature links. The language link loads a separate document and initializes Mapsight in that language."
									: "Dieser eigenständig gestaltete Host zeigt die native Mapsight-Komposition: Kategoriefilter, lokale Listensuche, Entfernungssortierung, Marker-Cluster, auswählbare Karten, Ortsdetails und teilbare Feature-Links. Der Sprachlink lädt ein eigenes Dokument und initialisiert Mapsight in dieser Sprache."}
							</p>
						</div>
						<div className="about-demo__details">
							<details>
								<summary>
									{en
										? "Data, map area & credits"
										: "Daten, Kartenausschnitt & Quellen"}
								</summary>
								<p>
									{en
										? "The tourism host and editorial illustrations are fictional. Eight public places were selected once from the primary OpenStreetMap API on 29 October 2026. Names and positions are OSM data; the short descriptions are our own. No events are included."
										: "Der Tourismushost und die redaktionellen Illustrationen sind fiktiv. Acht öffentliche Orte wurden am 29. Oktober 2026 einmalig aus der primären OpenStreetMap-API ausgewählt. Namen und Positionen sind OSM-Daten; die Kurztexte sind eigene Texte. Es sind keine Veranstaltungen enthalten."}
								</p>
								<p>
									©{" "}
									<a href="https://www.openstreetmap.org/copyright">
										OpenStreetMap contributors
									</a>{" "}
									·{" "}
									<a href="https://opendatacommons.org/licenses/odbl/1-0/">
										ODbL 1.0
									</a>{" "}
									·{" "}
									<a
										href={
											new URL(
												"./osm-pois.json",
												import.meta.url,
											).href
										}
									>
										{en
											? "Download separate OSM extract"
											: "Separaten OSM-Auszug herunterladen"}
									</a>{" "}
									·{" "}
									<a
										href={
											new URL(
												"./DATA.md",
												import.meta.url,
											).href
										}
									>
										{en
											? "Provenance and method"
											: "Herkunft und Methode"}
									</a>
								</p>
								<p>
									{en
										? "The map area is chosen solely because the existing tile proxy covers it: EPSG:3857 [1097392, 6789091, 1240635, 6895797], zoom 10–18. There is no connection to a real tourism operator or public authority. Basemap tiles use the same-origin proxy."
										: "Der Kartenausschnitt wurde ausschließlich gewählt, weil der vorhandene Kachelproxy ihn abdeckt: EPSG:3857 [1097392, 6789091, 1240635, 6895797], Zoom 10–18. Es besteht keine Verbindung zu einem realen Tourismusanbieter oder einer Verwaltung. Kartenkacheln nutzen den gleichursprünglichen Proxy."}
								</p>
								<p>
									{en
										? "Fonts: Georgia and system sans serif, supplied by your device. Illustrations: own SVG artwork, MIT. Map pictograms: bundled Mapsight traffic-style pictograms; no Font Awesome pictograms or remote assets are used."
										: "Schriften: Georgia und System-Sans-Serif von deinem Gerät. Illustrationen: eigene SVG-Grafiken, MIT. Kartenpiktogramme: mitgelieferte Mapsight-Traffic-Style-Piktogramme; keine Font-Awesome-Piktogramme oder extern geladenen Medien."}
								</p>
							</details>
							<details>
								<summary>
									{en
										? "What this example can and cannot do"
										: "Funktionen und Grenzen dieses Beispiels"}
								</summary>
								<p>
									{en
										? "No current opening hours, events, bookings, itineraries, favourites or free address search. Distances are straight-line estimates. Navigation leaves this page for OpenStreetMap or a device app; it is not routing inside Mapsight. The map uses a full-width host region because product breakpoints follow the viewport."
										: "Keine aktuellen Öffnungszeiten, Veranstaltungen, Buchungen, Reisepläne, Favoriten oder freie Adresssuche. Entfernungen sind Luftlinien. Die Navigation verlässt diese Seite zu OpenStreetMap oder einer Geräte-App; Mapsight berechnet hier keine Route. Die Karte nutzt die volle Hostbreite, weil Produkt-Breakpoints dem Viewport folgen."}
								</p>
								<p>
									{en
										? "The theme supports light and dark operating-system settings. Automated accessibility checks are a limited check; a complete manual accessibility review is still pending."
										: "Das Theme folgt den hellen und dunklen Betriebssystem-Einstellungen. Automatisierte Barrierefreiheitsprüfungen sind eine begrenzte Prüfung; eine vollständige manuelle Prüfung steht noch aus."}
								</p>
							</details>
						</div>
					</section>
				</main>
				<footer>
					<span>
						Musterland ·{" "}
						{en
							? "A fictional tourism demo"
							: "Eine fiktive Tourismusdemo"}
					</span>
					<a href="/scenarios/index.html">
						← {en ? "Back to scenarios" : "Zurück zu den Szenarien"}
					</a>
				</footer>
			</div>
		</>
	);
}

createRoot(document.getElementById("root")!).render(<TourismHost />);
