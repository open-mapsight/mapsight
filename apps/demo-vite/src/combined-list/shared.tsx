import {createCombinedListDemo} from "@mapsight/demo-shared/combined-list";

export {default as styleFunction} from "../generated/mapsight-vector-styles/demo";

const parksUrl = new URL("./data/parks.geojson", import.meta.url).toString();
const cafesUrl = new URL("./data/cafes.geojson", import.meta.url).toString();

export const {baseMapsightConfig, createOptions} = createCombinedListDemo({
	parks: parksUrl,
	cafes: cafesUrl,
});
