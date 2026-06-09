import type {ProjectionLike} from "ol/proj";

import type {Selector} from "@reduxjs/toolkit";
import {createSelector} from "@reduxjs/toolkit";
import {batchActions} from "redux-batched-actions";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";
import type {MapsightStyleFunctionEnv} from "@mapsight/lib-ol/style/styleFunction";

import {set} from "@/lib/base/actions";
import {createFilteredFeatureSourceSelector} from "@/lib/feature-sources/selectors";
import type {FeatureSourceData} from "@/lib/feature-sources/types";
import Mixin from "@/lib/helpers/Mixin";
import {
	setInteractionSelections,
	setInteractionStatus,
	setLayerStyle,
} from "@/lib/map/actions";
import type {InteractionsSelections} from "@/lib/map/types";
import type {State} from "@/types";

type Style = string | MapsightStyleFunctionEnv;

export const EDITOR_MODE = {
	NAVIGATE: "NAVIGATE",
	DRAW_POINT: "DRAW_POINT",
	DRAW_LINESTRING: "DRAW_LINESTRING",
	DRAW_POLYGON: "DRAW_POLYGON",
	SELECT: "SELECT",
	MODIFY: "MODIFY",
	TRANSLATE: "TRANSLATE",
};

export const DEFAULT_SELECTIONS = {
	mousedown: "select",
	mouseover: "highlight",
	touch: "select",
} satisfies InteractionsSelections;

export const DEFAULT_CONTROLLER_NAMES = {
	map: "map",
	featureSources: "featureSources",
	featureSelections: "featureSelections",
};

export const DEFAULT_DISPLAY_STYLE = "features";
export const DEFAULT_DRAW_STYLE = "draw";
export const DEFAULT_MODIFY_STYLE = "draw";
export const DEFAULT_PROJECTION = "EPSG:4326";

export const DEFAULT_DRAW_TYPE = "Point";

export const DEFAULT_MODIFY_PIXEL_TOLERANCE = 10;

export type EditorMixinOptions = {
	displayStyle: string | MapsightStyleFunctionEnv;
	drawStyle: string | MapsightStyleFunctionEnv;
	modifyStyle: string | MapsightStyleFunctionEnv;
	projection: ProjectionLike;
	selections: Record<string, string>;
	draw: {
		active?: boolean;
		type?: string;
		replacePrevious?: boolean;
		clearOnStart?: boolean;
	};
	modify: {
		active?: boolean;
		pixelTolerance?: number;
	};
	select: {active?: boolean};
	translate: {active?: boolean};
	show: {
		layer?: boolean;
	};
	measure: {
		active?: boolean;
		keepLabel?: boolean;
	};
	data: FeatureSourceData | undefined;
	enableHistory: boolean;
};

export default class EditorMixin extends Mixin<EditorMixinOptions> {
	override beforeInitialization() {
		this.ids = {
			featureSource: this.createId("featureSource"),
			layer: this.createId("layer"),
			drawInteraction: this.createId("drawInteraction"),
			translateInteraction: this.createId("translateInteraction"),
			//snapInteraction: this.createId('snapInteraction'),
			modifyInteraction: this.createId("modifyInteraction"),
		};
	}

	override bindSelectors() {
		return {
			features: createSelector(
				createFilteredFeatureSourceSelector(
					ensureNonNullable(this.controllers.featureSources),
					ensureNonNullable(this.ids.featureSource),
					this.controllers.map,
				),
				(state) => state?.data?.features,
			) as Selector<State, FeatureSourceData["features"]>,
		} as const;
	}

	override bindActions() {
		const modeMap = (
			draw: boolean,
			select: boolean,
			modify: boolean,
			translate: boolean,
			drawType?: string,
		) => ({
			draw: {active: draw, type: drawType},
			select: {active: select},
			modify: {active: modify},
			translate: {active: translate},
		});

		const MODE_ACTION_MAP = {
			[EDITOR_MODE.NAVIGATE]: modeMap(false, false, false, false),
			[EDITOR_MODE.DRAW_POINT]: modeMap(
				true,
				false,
				false,
				false,
				"Point",
			),
			[EDITOR_MODE.DRAW_LINESTRING]: modeMap(
				true,
				false,
				false,
				false,
				"LineString",
			),
			[EDITOR_MODE.DRAW_POLYGON]: modeMap(
				true,
				false,
				false,
				false,
				"Polygon",
			),
			[EDITOR_MODE.SELECT]: modeMap(false, true, false, false),
			[EDITOR_MODE.MODIFY]: modeMap(false, false, true, false),
			[EDITOR_MODE.TRANSLATE]: modeMap(false, true, false, true),
		};

		return {
			setDraw: (status: boolean) =>
				setInteractionStatus(
					ensureNonNullable(this.controllers.map),
					ensureNonNullable(this.ids.drawInteraction),
					status,
				),
			setModify: (status: boolean) =>
				setInteractionStatus(
					ensureNonNullable(this.controllers.map),
					ensureNonNullable(this.ids.modifyInteraction),
					status,
				),
			setTranslate: (status: boolean) =>
				setInteractionStatus(
					ensureNonNullable(this.controllers.map),
					ensureNonNullable(this.ids.translateInteraction),
					status,
				),
			setSelect: (status: boolean) =>
				setInteractionSelections(
					ensureNonNullable(this.controllers.map),
					ensureNonNullable(this.ids.layer),
					(status
						? this.getSelections()
						: {}) as InteractionsSelections,
				),
			set: (options: Partial<EditorMixinOptions> = {}) => {
				const {
					draw = {active: false},
					modify = {active: false},
					select = {active: false},
					translate = {active: false},
				} = options;
				const actions = [
					ensureNonNullable(this.actions.setDraw)(draw.active),
					ensureNonNullable(this.actions.setModify)(modify.active),
					ensureNonNullable(this.actions.setSelect)(select.active),
					ensureNonNullable(this.actions.setTranslate)(
						translate.active,
					),
				];

				if (draw.type) {
					actions.push(
						ensureNonNullable(this.actions.setDrawType)(draw.type),
					);
				}

				return batchActions(actions);
			},
			setMode: (mode: string) =>
				ensureNonNullable(this.actions.set)(MODE_ACTION_MAP[mode]),

			setDrawType: (type: string) =>
				set(
					[
						ensureNonNullable(this.controllers.map),
						"interactions",
						ensureNonNullable(this.ids.drawInteraction),
						"options",
						"type",
					],
					type,
				),
			//setSnap: status => setInteractionStatus(this.controllers.map, this.ids.snapInteraction, !!status),
			setLayerVisibility: (visible: boolean) =>
				set(
					[
						ensureNonNullable(this.controllers.map),
						ensureNonNullable(this.ids.layer),
						"options",
						"visible",
					],
					visible,
				),
			setDisplayStyle: (style: Style) =>
				setLayerStyle(
					ensureNonNullable(this.controllers.map),
					ensureNonNullable(this.ids.layer),
					style,
				),
			setDrawStyle: (style: Style) =>
				set(
					[
						ensureNonNullable(this.controllers.map),
						"interactions",
						ensureNonNullable(this.ids.drawInteraction),
						"options",
						"style",
					],
					style,
				),
			setModifyStyle: (style: Style) =>
				set(
					[
						ensureNonNullable(this.controllers.map),
						"interactions",
						ensureNonNullable(this.ids.modifyInteraction),
						"options",
						"style",
					],
					style,
				),
		};
	}

	override getDefaultControllerNames() {
		return DEFAULT_CONTROLLER_NAMES;
	}

	getSelections() {
		return this.options.selections || DEFAULT_SELECTIONS;
	}

	override getInitialState() {
		const {
			displayStyle = DEFAULT_DISPLAY_STYLE,
			drawStyle = DEFAULT_DRAW_STYLE,
			modifyStyle = DEFAULT_MODIFY_STYLE,
			projection = DEFAULT_PROJECTION,
			draw: initialDraw = {
				active: false,
				type: DEFAULT_DRAW_TYPE,
				replacePrevious: false,
				clearOnStart: false,
			},
			select: initialSelect = {active: false},
			modify: initialModify = {
				active: false,
				pixelTolerance: DEFAULT_MODIFY_PIXEL_TOLERANCE,
			},
			translate: initialTranslate = {active: false},
			//snap: initialSnap = {active: false},
			show: {layer: showLayer = true} = {},
			data = {},
			enableHistory = false,
		} = this.options;

		const describeSource = (
			id?: string,
			featureSelections?: Array<string>,
			forLayer = false,
		) => ({
			type: "VectorFeatureSource",
			options: {
				projection: projection,
				featureSourceId: this.ids.featureSource,
				featureSourcesControllerName: this.controllers.featureSources,
				featureSelectionsControllerName:
					this.controllers.featureSelections,
				keepFeaturesInViewSelections: forLayer ? ["select"] : [],
				fitFeaturesInViewSelections: forLayer ? ["select"] : [],
				canAnimate: forLayer,
				canCluster: forLayer,
				useSelectionOverlay: forLayer,
				featureSelections: featureSelections,
			},
		});

		return {
			[ensureNonNullable(this.controllers.map)]: {
				interactions: {
					[ensureNonNullable(this.ids.drawInteraction)]: {
						type: "DrawInteraction",
						options: {
							active: initialDraw.active,
							type: initialDraw.type,
							style: drawStyle,
							replacePrevious: initialDraw.replacePrevious,
							clearOnStart: initialDraw.clearOnStart,
							source: describeSource("draw"),
							stopClick: true,
						},
					},
					//[this.ids.snapInteraction]: {
					//	type: 'Snap',
					//	options: {
					//		active: initialSnap.active,
					//	},
					//},
					[ensureNonNullable(this.ids.modifyInteraction)]: {
						type: "ModifyInteraction",
						options: {
							active: initialModify.active,
							pixelTolerance: initialModify.pixelTolerance,
							source: describeSource("modify"),
							style: modifyStyle,
						},
					},
					[ensureNonNullable(this.ids.translateInteraction)]: {
						type: "TranslateInteraction",
						options: {
							active: initialTranslate.active,
							source: describeSource("translate", ["select"]),
						},
					},
				},
				layers: {
					[ensureNonNullable(this.ids.layer)]: {
						type: "VectorLayer",
						options: {
							visible: showLayer,
							style: displayStyle,
							renderBuffer: 200,
							selections: initialSelect.active
								? this.getSelections()
								: [],
							source: describeSource("layer", [], true),
						},
					},
				},
			},
			[ensureNonNullable(this.controllers.featureSources)]: {
				[ensureNonNullable(this.ids.featureSource)]: {
					enableHistory: enableHistory,
					data: data,
					isLoading: true,
				},
			},
		};
	}
}
