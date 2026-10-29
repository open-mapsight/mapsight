import type {PropsWithChildren} from "react";
import {useSelector} from "react-redux";

import {visibleLayerAttributionsSelector} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../../config/constants/controllers";
import PictogramAttributionLine from "../citations/pictogram-attribution-line";
import {usePictogramAttributions} from "../citations/use-pictogram-attributions";
import AttributionEntries from "./attribution-entries";

function selectVisibleLayerAttributions(state: State) {
	return visibleLayerAttributionsSelector(state[MAP] as MapState);
}

function Attribution({children}: PropsWithChildren) {
	const attributions = useSelector(selectVisibleLayerAttributions);
	const pictogramAttributions = usePictogramAttributions();

	return (
		<AttributionEntries
			attributions={attributions ?? undefined}
			extraEntries={pictogramAttributions.map((license) => (
				<PictogramAttributionLine
					key={license.source}
					license={license}
				/>
			))}
		>
			{children}
		</AttributionEntries>
	);
}

export default Attribution;
