import type {FrameState} from "ol/Map";
import {inView as layerInView} from "ol/layer/Layer";

import unique from "lodash/uniq";

export default function getVisibleLayersFromFramestate(frameState: FrameState) {
	return unique(
		frameState.layerStatesArray
			.filter((layerState) =>
				layerInView(layerState, frameState.viewState),
			)
			.map(({layer}) => layer),
	);
}
