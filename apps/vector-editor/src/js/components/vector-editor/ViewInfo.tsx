import {useSelector} from "react-redux";

import proj4 from "proj4";

import type {MapState} from "@mapsight/core/lib/map/types";

import Coords from "./Coords.tsx";

const viewSelector = (state: {map: MapState}) =>
	state.map.view as {center: [number, number]; zoom: number};

const ViewInfo = () => {
	const {center, zoom} = useSelector(viewSelector);
	const coords = proj4("EPSG:3857", "WGS84", center);

	return (
		<p className="ms3-vector-editor-view-info">
			z {zoom}
			<Coords coords={coords} />
		</p>
	);
};

export default ViewInfo;
