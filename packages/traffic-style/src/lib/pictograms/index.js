import {fontAwesomePictograms} from "../../generated/pictograms/fontawesome.js";
import {trafficStylePictograms} from "../../generated/pictograms/traffic-style.js";

const byId = new Map();
for (const pictogram of [...trafficStylePictograms, ...fontAwesomePictograms]) {
	byId.set(pictogram.id, pictogram);
}
export const pictograms = [...byId.values()];
export function getPictogram(id) {
	const pictogram = byId.get(id);
	if (!pictogram) {
		throw new Error(`Unknown pictogram: ${id}`);
	}
	return pictogram;
}
export function hasPictogram(id) {
	return byId.has(id);
}
export function listPictogramIds() {
	return [...byId.keys()].sort();
}
export function listPictogramIdsBySource(source) {
	return pictograms
		.filter((pictogram) => pictogram.source === source)
		.map((pictogram) => pictogram.id)
		.sort();
}
//# sourceMappingURL=index.js.map
