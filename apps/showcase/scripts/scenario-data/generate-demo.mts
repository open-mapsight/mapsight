/** Deterministic fictional replacement; no external data or source coordinates. */
import {writeFileSync} from "node:fs";

const features = Array.from({length: 40}, (_, index) => {
	const id = `muster-ladepunkt-${String(index + 1).padStart(2, "0")}`;
	const power = index % 3 === 0 ? "150 kW" : "22 kW";
	const kind = index % 3 === 0 ? "Schnellladen" : "Normalladen";
	const plug = index % 3 === 0 ? "DC Kupplung Combo" : "AC Steckdose Typ 2";
	return {
		type: "Feature",
		id,
		properties: {
			id,
			mapsightIconId: "charging-station",
			name: `Muster-Ladepunkt ${index + 1} (fiktiv)`,
			description: `<p>Fiktive Demodaten – kein realer Standort oder Betreiber.</p><p>${kind}, ${power}, 2 Ladepunkte.</p><p>Anschluss: ${plug}. Beispielbetrieb Musterenergie.</p>`,
			listInformation: `${power}, ${kind}; 2 Ladepunkte; ${plug} · fiktiv`,
			chargingPower: power,
			tagGroups: {
				Art: {andJunction: false, tags: [kind]},
				Anschluss: {andJunction: false, tags: [plug]},
				Leistung: {andJunction: false, tags: [power]},
			},
		},
		geometry: {
			type: "Point",
			coordinates: [
				10.46 + (index % 8) * 0.012,
				52.23 + Math.floor(index / 8) * 0.014,
			],
		},
	};
});
writeFileSync(
	new URL("../../src/data/demo.geojson", import.meta.url),
	JSON.stringify({type: "FeatureCollection", features}, null, "\t") + "\n",
);
