import {createRoot} from "react-dom/client";
import {useSelector} from "react-redux";

import FeatureList from "@mapsight/ui/components/feature-list";
import FeatureSelectionInfo from "@mapsight/ui/components/feature-selection-info/index";
import Map from "@mapsight/ui/components/map";
import Attribution from "@mapsight/ui/components/map-overlay/attribution";
import ZoomButtons from "@mapsight/ui/components/map-overlay/zoom-buttons";
import MapWrapper from "@mapsight/ui/components/map-wrapper";
import TagSwitcher from "@mapsight/ui/components/tag-switcher";
import {selectedFeatureSelector} from "@mapsight/ui/store/selectors";

import {AboutDemo, DemoNotice} from "../shared/about-demo.tsx";
import {NativeInstance} from "../shared/native-instance.tsx";
import {
	baseMapsightConfig,
	createOptions,
	styleFunction,
} from "./mapsight-config.ts";

import "../shared/host.css";
import "./host.scss";

function ServiceDetails() {
	const feature = useSelector(selectedFeatureSelector);
	return (
		<FeatureSelectionInfo feature={feature} enableKeyboardControl={true} />
	);
}
createRoot(document.getElementById("root")!).render(
	<>
		<DemoNotice />
		<div className="host">
			<header className="host-header">
				<div className="wordmark">Musterstadt · Bürgerservice</div>
				<p>Ihr Anliegen. Ihr Weg zur Servicestelle.</p>
			</header>
			<main>
				<nav className="breadcrumb" aria-label="Brotkrümelnavigation">
					<a href="/scenarios/index.html">Szenarien</a> /
					Bürgerservice
				</nav>
				<section className="service-intro">
					<h1 className="kern-heading-x-large">
						Welche Servicestelle passt zu Ihrem Anliegen?
					</h1>
					<p className="kern-body-large">
						Wählen Sie Ihr Anliegen und den gewünschten Zugang.
						Vergleichen Sie die Servicestellen in der Liste und
						öffnen Sie einen Eintrag für die
						Beispiel-Öffnungszeiten.
					</p>
					<p>
						Für einen Entfernungsvergleich stehen fiktive
						Ausgangspunkte in der Sortierung bereit. Die Entfernung
						ist Luftlinie, keine Wegstrecke.
					</p>
					<a href="#service-results">Direkt zur Ergebnisliste</a>
				</section>
				<NativeInstance
					baseMapsightConfig={baseMapsightConfig}
					createOptions={createOptions}
					styleFunction={styleFunction}
				>
					<section
						className="service-filters"
						aria-label="Servicestellen filtern"
					>
						<h2 className="kern-heading-medium">
							1. Anliegen und Zugang wählen
						</h2>
						<TagSwitcher />
					</section>
					<div className="service-workspace">
						<section
							className="service-cartography"
							aria-label="Karte der fiktiven Servicestellen"
						>
							<h2 className="kern-heading-medium">
								2. Lage vergleichen
							</h2>
							<MapWrapper>
								<Map />
								<div className="service-zoom">
									<ZoomButtons />
								</div>
								<Attribution />
							</MapWrapper>
						</section>
						<section
							id="service-results"
							className="service-results"
							aria-label="Ergebnisliste"
						>
							<h2 className="kern-heading-medium">
								3. Servicestelle auswählen
							</h2>
							<FeatureList enableKeyboardControl={true} />
						</section>
					</div>
					<section
						className="service-details"
						aria-label="Details zur ausgewählten Servicestelle"
					>
						<ServiceDetails />
					</section>
				</NativeInstance>
				<AboutDemo
					features={[
						"Native Karte und Liste in einem gemeinsamen Hostlayout; Filter für Anliegen und Zugang",
						"Lokale Listensuche, Pagination und Entfernung ab fiktiven Ausgangspunkten",
						"Öffnungszeiten in HTML-Details; Feature-Deep-Links; automatische Überschriften ab Ebene 2",
					]}
					gaps={[
						"G1: Einige Bedienicons sind derzeit noch blau. Die Produktkorrektur erfolgt separat.",
						"G2: Mapsight orientiert sich am Viewport, nicht an der Containerbreite. Der Host komponiert Karte und Liste selbst.",
						"G3: Keine freie Adresssuche; Entfernung nur ab hinterlegtem Ausgangspunkt oder freigegebenem Gerätestandort.",
						"G5: Detailinhalte sind HTML aus den lokalen Demodaten, kein kommunales Fachverfahren.",
						"G13: KERN-CSS und automatisierte Prüfungen sind keine Zertifizierung. Eine vollständige manuelle Prüfung steht aus.",
					]}
				/>
			</main>
			<footer>
				<a href="/scenarios/index.html">Zurück zu den Szenarien</a>
			</footer>
		</div>
	</>,
);
