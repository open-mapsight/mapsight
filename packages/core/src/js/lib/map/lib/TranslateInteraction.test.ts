import VectorSource from "ol/source/Vector";
import VectorEventType from "ol/source/VectorEventType";

import {describe, expect, it} from "vitest";

import type {VectorFeatureSource} from "@/lib/map/lib/VectorFeatureSource";

import TranslateInteraction from "./TranslateInteraction";

const sourceEventTypes = [
	VectorEventType.ADDFEATURE,
	VectorEventType.CLEAR,
	VectorEventType.REMOVEFEATURE,
];

function createSource() {
	return new VectorSource() as unknown as VectorFeatureSource;
}

function listenerCount(source: VectorFeatureSource) {
	return sourceEventTypes.reduce(
		(count, type) => count + (source.getListeners(type)?.length ?? 0),
		0,
	);
}

describe("TranslateInteraction source listeners", () => {
	it("removes its listeners when the source is swapped or unset", () => {
		const interaction = new TranslateInteraction({});
		const sourceA = createSource();
		const sourceB = createSource();

		interaction.setSource(sourceA);
		expect(listenerCount(sourceA)).toBe(sourceEventTypes.length);

		interaction.setSource(sourceB);
		expect(listenerCount(sourceA)).toBe(0);
		expect(listenerCount(sourceB)).toBe(sourceEventTypes.length);

		interaction.setSource(null);
		expect(listenerCount(sourceA)).toBe(0);
		expect(listenerCount(sourceB)).toBe(0);
	});

	it("does not stack listeners when the same source is set repeatedly", () => {
		const interaction = new TranslateInteraction({});
		const source = createSource();

		interaction.setSource(source);
		interaction.setSource(source);

		expect(listenerCount(source)).toBe(sourceEventTypes.length);
	});
});
