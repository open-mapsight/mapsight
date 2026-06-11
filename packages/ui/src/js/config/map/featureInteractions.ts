import type {FeatureInteractions} from "@mapsight/core/lib/map/lib/WithFeatureInteractions";

export default function createFeatureInteractions({
	hitTolerance = 5,
	deselectUncontrolledOnClick = null,
}: {
	hitTolerance?: number;
	deselectUncontrolledOnClick?: Array<string> | null;
} = {}): FeatureInteractions {
	return {
		mouseover: {
			selection: "mouseover",
			options: {
				// mouse event button
				main: true,
				auxiliary: false,
				secondary: false,
				fourth: false,
				fifth: false,

				// options
				cursor: "pointer",
				deselectUncontrolled: null,
				hitTolerance: hitTolerance,
			},
		},

		mousedown: {
			selection: "mousedown",
			options: {
				// mouse event button
				main: true,
				auxiliary: false,
				secondary: false,
				fourth: false,
				fifth: false,

				// options
				deselectUncontrolled: deselectUncontrolledOnClick,
				hitTolerance: hitTolerance,
			},
		},

		touch: {
			selection: "touch",
			options: {
				// options
				deselectUncontrolled: deselectUncontrolledOnClick,
				hitTolerance: hitTolerance,
			},
		},
	} satisfies FeatureInteractions;
}
