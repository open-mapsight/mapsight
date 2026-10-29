import source from "./osm-pois.json";

export type Language = "de" | "en";
export const language: Language =
	document.documentElement.lang === "en" ? "en" : "de";
export const en = language === "en";
export const categories = en
	? ["Museums", "Green spaces", "Architecture", "On stage"]
	: ["Museen", "Im Grünen", "Architektur", "Bühne"];
const pictograms = [
	"museum/#824138",
	"parkanlage/#526648",
	"sehenswuerdigkeit/#9b5528",
	"theater/#75516b",
];
const descriptions = en
	? [
			"A museum stop for your city wander. Choose it on the map and share the place with your travel companion.",
			"Make room for a museum on your next outing. This example introduces the place, without promising a current exhibition.",
			"A green pause between discoveries. Use the map to see where this park sits in relation to the other places.",
			"A park to add to your shortlist for an unhurried day outside. Compare its location before heading out.",
			"An architectural stop for a slow walk through the city. Look up, take your time, and explore the surroundings.",
			"A different perspective on the city's architecture. Save this place as a shared link for your next walk.",
			"A theatre for your cultural shortlist. The programme, tickets and performance dates are not included in this demo.",
			"An idea for an evening at the theatre. Check the current programme independently before planning a visit.",
		]
	: [
			"Ein Museumsstopp für deinen Stadtspaziergang. Schau dir die Lage an und teile den Ort mit deiner Reisebegleitung.",
			"Nimm dir Zeit für ein Museum. Dieses Beispiel stellt den Ort vor, ohne eine aktuelle Ausstellung zu versprechen.",
			"Eine grüne Pause zwischen zwei Entdeckungen. Auf der Karte siehst du, wie der Park zu den anderen Orten liegt.",
			"Ein Park für einen entspannten Tag draußen. Vergleiche die Lage, bevor du dich auf den Weg machst.",
			"Ein Architektur-Stopp für einen langsamen Stadtspaziergang. Schau nach oben und entdecke die Umgebung.",
			"Ein anderer Blick auf die Architektur der Stadt. Teile diesen Ort als Idee für euren nächsten Spaziergang.",
			"Ein Theater für deine Kulturliste. Spielplan, Tickets und Vorstellungstermine sind in dieser Demo nicht enthalten.",
			"Eine Idee für einen Theaterabend. Informiere dich vor deinem Besuch unabhängig über das aktuelle Programm.",
		];

export const places = {
	...source,
	type: "FeatureCollection" as const,
	crs: {type: "name", properties: {name: "EPSG:4326"}},
	features: source.features.map((feature, index) => {
		const category = Math.floor(index / 2);
		const osm = `https://www.openstreetmap.org/${feature.properties.osmType}/${feature.properties.osmId}`;
		return {
			...feature,
			type: "Feature" as const,
			geometry: {...feature.geometry, type: "Point" as const},
			properties: {
				name: feature.properties.tags.name,
				category,
				summary: descriptions[index],
				mapsightIconId: pictograms[category],
				tagGroups: {
					[en ? "Your kind of day" : "Worauf hast du Lust?"]: {
						andJunction: false,
						tags: [categories[category]],
					},
				},
				description: `<p>${descriptions[index]}</p><p><strong>${en ? "Before you go" : "Vor deinem Besuch"}</strong><br>${en ? "Names and positions: OSM extract, 29 October 2026. Opening hours, admission, accessibility and current programmes have not been checked. Way positions are approximate, not entrances." : "Namen und Positionen: OSM-Auszug, 29. Oktober 2026. Öffnungszeiten, Eintritt, Zugänglichkeit und aktuelle Programme wurden nicht geprüft. Positionen von Flächen sind ungefähr und keine Eingänge."}</p><p><a href="${osm}" target="_blank" rel="noopener noreferrer">${en ? "View source on OpenStreetMap (external website)" : "Quelle auf OpenStreetMap ansehen (externe Website)"}</a></p>`,
			},
		};
	}),
};
