import type {FrameState} from "ol/Map";
import * as olArray from "ol/array";
import type RenderEvent from "ol/render/Event";

import * as nonNull from "@mapsight/lib-js/nonNullable";
import getVisibleLayersFromFramestate from "@mapsight/lib-ol/map/getVisibleLayersFromFramestate";

import {async, controlled, set} from "@/lib/base/actions";

import WithMap from "./WithMap";
import {getIdForLayer} from "./tagLayer";
import throttleDispatch from "./throttleDispatch";

export default class WithVisibleLayers extends WithMap {
	override init() {
		const map = this.getMap();
		if (!map) {
			console.error(
				"Could not initialize WithVisibleLayers mixin: map is not defined",
			);
			return;
		}

		let visibleLayers: Array<string> = [];

		const updateVisibleLayers = throttleDispatch(
			(frameState: FrameState) => {
				const newVisibleLayers = getVisibleLayersFromFramestate(
					frameState,
				)
					.map(getIdForLayer)
					.filter(nonNull.is);

				if (!olArray.equals(newVisibleLayers, visibleLayers)) {
					visibleLayers = newVisibleLayers;
					this.dispatch(
						async(
							controlled(
								set(
									[this.getName(), "visibleLayers"],
									visibleLayers,
								),
							),
						),
					);
				}
			},
		);

		map.on("postrender", (event: RenderEvent) => {
			const {frameState} = event;
			if (frameState) {
				updateVisibleLayers(frameState);
			}
		});
	}
}
