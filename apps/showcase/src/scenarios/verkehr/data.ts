import type {Feature} from "@mapsight/core/types";

export type Period = "day" | "week";

/** All geometry, names and values are invented. No feed or deployment data. */
export function trafficData(step: number, period: Period) {
	const shifted = step % 2 === 1;
	const point = (
		id: string,
		coordinates: number[],
		properties: Feature["properties"],
	): Feature => ({
		type: "Feature",
		id,
		geometry: {type: "Point", coordinates},
		properties,
	});
	const incidents: Feature[] = [
		point("closure-west", [10.475, 52.265], {
			name: "Musterallee · Vollsperrung",
			mapsightIconId: "vollsperrung",
			listInformation: "12.–14. Juni · Zufahrt gesperrt",
			description:
				"<p>Fiktive Vollsperrung vom 12. bis 14. Juni 2026. Eine erfundene Umleitung führt über den Musterring.</p><p>Keine Verkehrsauskunft und keine Empfehlung für Ihre Fahrt.</p>",
		}),
		point("works-centre", [10.526, 52.277], {
			name: "Musterring · Bauarbeiten",
			mapsightIconId: "baustelle",
			listInformation: "12. Juni · Eine Fahrspur verfügbar",
			description:
				"<p>Fiktive Bauarbeiten am Musterring am 12. Juni 2026. Im Beispiel bleibt eine Fahrspur verfügbar.</p>",
		}),
		...(period === "week"
			? [
					point("works-east", [10.577, 52.256], {
						name: "Musterbrücke · Geplante Arbeiten",
						mapsightIconId: "baustelle",
						listInformation: "16.–19. Juni · Vorschau",
						description:
							"<p>Erfundene Maßnahme vom 16. bis 19. Juni 2026. Die Wochenansicht ergänzt diese Meldung.</p>",
					}),
				]
			: []),
	];
	const parkingValues = shifted ? [34, 86, 12] : [48, 72, 8];
	const parking = [
		{
			label: "Parkhaus Mustermitte",
			coordinates: [10.521, 52.267],
			capacity: 180,
		},
		{
			label: "Parkhaus Musterost",
			coordinates: [10.561, 52.271],
			capacity: 240,
		},
		{
			label: "Parkplatz Musterufer",
			coordinates: [10.497, 52.249],
			capacity: 80,
		},
	].map(({label, coordinates, capacity}, index) =>
		point(`parking-${index + 1}`, coordinates, {
			name: label,
			mapsightIconId: "parkhaus",
			markerCaption: String(parkingValues[index]),
			markerCaptionColor: "#075985",
			listInformation: `${parkingValues[index]} von ${capacity} Plätzen frei · simuliert`,
			description: `<p>${parkingValues[index]} von ${capacity} Stellplätzen frei. Dies sind simulierte Werte, keine gemessene Belegung.</p><p>Mit „Nächsten Demo-Stand zeigen“ ändern sich Karte, Liste und die Zusammenfassung gemeinsam.</p>`,
			freeSpaces: parkingValues[index],
		}),
	);
	const counters = [
		point("counter-a", [10.537, 52.247], {
			name: "Zählstelle Musterufer",
			mapsightIconId: "info",
			listInformation: "Radverkehr · synthetische Tageswerte",
			description:
				'<p>Erfundener Standort. Das Diagramm nutzt die bestehende lokale Count-Aggregator-Demo „Example Counter A“ und synthetische Werte.</p><div class="js-ms3-smart-city-metric" data-ms3-station-type="bicycleSensorTotal" data-ms3-station-id="150" data-ms3-station-label="Radverkehr · Demodaten"></div>',
		}),
	];
	return {
		incidents,
		parking,
		counters,
		freeSpaces: parkingValues.reduce((sum, value) => sum + value, 0),
	};
}
