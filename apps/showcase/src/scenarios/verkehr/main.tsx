import {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {useDispatch, useSelector} from "react-redux";

import FeatureList from "@mapsight/ui/components/feature-list";
import FeatureSelectionInfo from "@mapsight/ui/components/feature-selection-info/index";
import Instance from "@mapsight/ui/components/instance";
import LayerSwitcher from "@mapsight/ui/components/layer-switcher/index";
import Wrapper from "@mapsight/ui/components/layout/wrapper";
import Map from "@mapsight/ui/components/map";
import Attribution from "@mapsight/ui/components/map-overlay/attribution";
import ZoomButtons from "@mapsight/ui/components/map-overlay/zoom-buttons";
import MapWrapper from "@mapsight/ui/components/map-wrapper";
import {selectedFeatureSelector} from "@mapsight/ui/store/selectors";

import {setData} from "@mapsight/core/lib/feature-sources/actions";

import {registerStaticMock} from "../../count-aggregator/register-static-mock.ts";
import {type Period, trafficData} from "./data.ts";
import {
	baseMapsightConfig,
	createOptions,
	styleFunction,
} from "./mapsight-config.ts";

import "./host.scss";

function TrafficBoard() {
	const [step, setStep] = useState(0);
	const [period, setPeriod] = useState<Period>("day");
	const dispatch = useDispatch();
	const feature = useSelector(selectedFeatureSelector);
	const data = useMemo(() => trafficData(step, period), [step, period]);
	useEffect(() => {
		dispatch(
			setData("featureSources", "incidents", {
				type: "FeatureCollection",
				features: data.incidents,
			}),
		);
		dispatch(
			setData("featureSources", "parking", {
				type: "FeatureCollection",
				features: data.parking,
			}),
		);
		dispatch(
			setData("featureSources", "counters", {
				type: "FeatureCollection",
				features: data.counters,
			}),
		);
	}, [data, dispatch]);
	return (
		<>
			<div className="traffic-controls">
				<div>
					<p className="traffic-eyebrow">
						Simulation · kein Livebetrieb
					</p>
					<p role="status" className="traffic-timestamp">
						Beispieltag 12. Juni 2026 ·{" "}
						{step % 2 === 0 ? "09:00" : "09:15"} Uhr
					</p>
				</div>
				<label>
					Zeitraum{" "}
					<select
						value={period}
						onChange={(event) =>
							setPeriod(event.target.value as Period)
						}
					>
						<option value="day">Beispieltag · 12. Juni</option>
						<option value="week">Woche · 12.–19. Juni</option>
					</select>
				</label>
				<button
					className="traffic-update"
					onClick={() => setStep((value) => value + 1)}
				>
					Nächsten Demo-Stand zeigen
				</button>
			</div>
			<dl
				className="traffic-stats"
				aria-label="Gesamter Demo-Datenbestand, unabhängig von eingeblendeten Ebenen"
			>
				<div>
					<dt>Verkehrsmeldungen</dt>
					<dd data-testid="incident-count">
						{data.incidents.length}
					</dd>
				</div>
				<div>
					<dt>Parkstandorte</dt>
					<dd>{data.parking.length}</dd>
				</div>
				<div>
					<dt>Freie Plätze · simuliert</dt>
					<dd data-testid="free-spaces">{data.freeSpaces}</dd>
				</div>
				<div>
					<dt>Demo-Zählstelle</dt>
					<dd>1</dd>
				</div>
			</dl>
			<p className="traffic-scope">
				Gesamtbestand im gewählten Zeitraum. Die Ebenenauswahl steuert
				Karte und Ergebnisliste.
			</p>
			<div className="traffic-workspace">
				<aside
					className="traffic-layers"
					aria-labelledby="traffic-layers-title"
				>
					<h2 id="traffic-layers-title">Ebenen</h2>
					<LayerSwitcher />
					<div className="traffic-legend">
						<h3>Legende</h3>
						<p>
							<span className="traffic-dot traffic-dot--closure" />{" "}
							Vollsperrung
						</p>
						<p>
							<span className="traffic-dot traffic-dot--works" />{" "}
							Bauarbeiten
						</p>
						<p>
							<span className="traffic-dot traffic-dot--parking" />{" "}
							Parken · Zahl = freie Plätze
						</p>
					</div>
					<a href="#traffic-results">Zur Ergebnisliste</a>
				</aside>
				<section
					className="traffic-cartography"
					aria-label="Karte der fiktiven Verkehrslage"
				>
					<MapWrapper>
						<Map />
						<div className="traffic-zoom">
							<ZoomButtons />
						</div>
						<Attribution />
					</MapWrapper>
				</section>
				<section
					className="traffic-results"
					id="traffic-results"
					aria-labelledby="traffic-results-title"
				>
					<h2 id="traffic-results-title">Meldungen und Standorte</h2>
					<FeatureList enableKeyboardControl={true} />
				</section>
			</div>
			<section
				className="traffic-details"
				aria-label="Details zum ausgewählten Eintrag"
			>
				<FeatureSelectionInfo
					feature={feature}
					enableKeyboardControl={true}
				/>
			</section>
		</>
	);
}

function TrafficPage() {
	return (
		<>
			<a href="#traffic-content" className="traffic-skip">
				Zum Inhalt
			</a>
			<aside className="traffic-notice">
				<strong>Fiktive Demo im Mapsight-Showcase.</strong> Namen,
				Positionen, Meldungen und Messwerte sind erfunden. Keine reale
				Verkehrszentrale und keine Verkehrsauskunft.{" "}
				<a href="/scenarios/index.html">Alle Szenarien</a>
			</aside>
			<header className="traffic-masthead">
				<div>
					<p className="traffic-eyebrow">
						Unterwegs in der Musterregion
					</p>
					<p className="traffic-wordmark">
						Verkehrszentrale<span>Musterregion</span>
					</p>
				</div>
				<a href="#traffic-about">Über diese Demo ↗</a>
			</header>
			<main id="traffic-content" className="traffic-content">
				<div className="traffic-intro">
					<p className="traffic-eyebrow">
						Verkehr · Parken · Zählstellen
					</p>
					<h1>Die Lage im Blick.</h1>
					<p>
						Vergleichen Sie Meldungen und freie Parkplätze. Öffnen
						Sie eine Zählstelle für beispielhafte Radverkehrsdaten.
					</p>
				</div>
				<Instance
					baseMapsightConfig={baseMapsightConfig}
					createOptions={createOptions}
					styleFunction={styleFunction}
				>
					<Wrapper className="traffic-map">
						<TrafficBoard />
					</Wrapper>
				</Instance>
				<section id="traffic-about" className="traffic-about">
					<h2>Über diese Demo</h2>
					<p>
						Mapsight ist nativ in das Layout dieser fiktiven
						Hostseite eingebunden: Ebenen, Karte, Liste und
						Detailbereich bilden eine gemeinsame Anwendung. Der
						Zeitraumfilter und der Wechsel des Demo-Stands werden
						vom Host gesteuert und ändern dieselben Datenquellen,
						die Karte und Liste verwenden.
					</p>
					<h3>Gezeigte Funktionen</h3>
					<ul>
						<li>
							Gemeinsame Ergebnisliste der sichtbaren Ebenen;
							lokale Suche und Auswahl auf der Karte.
						</li>
						<li>
							Erfundene Parkbelegung mit Zahlen an den
							Kartensymbolen und manuell wechselnden
							Beispielwerten.
						</li>
						<li>
							Diagramm in den Details der Zählstelle über die
							lokale Count-Aggregator-Demo.
						</li>
						<li>
							Hosteigene Typografie und Anordnung sowie helle und
							dunkle OS-Farbschemata.
						</li>
					</ul>
					<h3>Grenzen und Quellen</h3>
					<p>
						Kein Live-Feed, keine automatische Aktualisierung, keine
						Stauprognose oder Routenberechnung. Der Wechselknopf
						wechselt zwischen zwei festen Datensätzen.
						Zählstellenwerte sind synthetisch; der Diagrammzeitraum
						ist unabhängig vom Beispieltag. Das Kartengebiet wurde
						allein wegen der vorhandenen Kachelabdeckung gewählt.
						Das Produkt richtet seine Layoutumschaltung am
						Browserfenster aus; diese Seite komponiert die Bereiche
						selbst.
					</p>
					<p>
						Eigene Demodaten und Inhalte: MIT. Systemschriften,
						keine externen Bilder. Kartengrundlage:{" "}
						<a href="https://www.openstreetmap.org/copyright">
							© OpenStreetMap-Mitwirkende, ODbL
						</a>
						. Barrierefreiheit ist ein Gestaltungsziel; eine
						vollständige manuelle Prüfung steht aus.
					</p>
					<p>
						<a href="/scenarios/index.html">
							Zurück zu den Szenarien
						</a>{" "}
						· <a href="/privacy">Datenschutz im Showcase</a>
					</p>
				</section>
			</main>
			<footer className="traffic-footer">
				Verkehrszentrale Musterregion · ausschließlich fiktive
				Demonstration
			</footer>
		</>
	);
}

const root = createRoot(document.getElementById("root")!);
void registerStaticMock()
	.then(() => root.render(<TrafficPage />))
	.catch(() =>
		root.render(
			<main>
				<h1>Demo nicht verfügbar</h1>
				<p>
					Die lokale Datensimulation konnte nicht gestartet werden.
					Bitte laden Sie die Seite erneut.
				</p>
				<a href="/scenarios/index.html">Zur Szenarienübersicht</a>
			</main>,
		),
	);
