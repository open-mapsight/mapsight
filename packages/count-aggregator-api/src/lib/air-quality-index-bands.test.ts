import {describe, expect, it} from "vitest";

import {
	AIR_QUALITY_INDEX_BANDS,
	airQualityIndexBandColor,
	airQualityIndexBandLabel,
	isAirQualityIndexStationType,
	isAirQualityIndexUnit,
	resolveAirQualityIndexBand,
} from "./air-quality-index-bands.js";

describe("air quality index bands", () => {
	it("exposes five UBA bands with stable colors", () => {
		expect(AIR_QUALITY_INDEX_BANDS.map((band) => band.id)).toEqual([
			1, 2, 3, 4, 5,
		]);
		expect(AIR_QUALITY_INDEX_BANDS[0]?.color).toBe("#50F0E6");
		expect(AIR_QUALITY_INDEX_BANDS[4]?.color).toBe("#960032");
	});

	it("detects index station types and units", () => {
		expect(isAirQualityIndexStationType("airQualityIndex")).toBe(true);
		expect(isAirQualityIndexStationType("airQualityPM10Index")).toBe(true);
		expect(isAirQualityIndexStationType("airQualityPM10")).toBe(false);
		expect(isAirQualityIndexStationType("trafficIndex")).toBe(false);
		expect(isAirQualityIndexUnit("index")).toBe(true);
		expect(isAirQualityIndexUnit("µg/m³")).toBe(false);
	});

	it("floors continuous scores into UBA classes", () => {
		expect(resolveAirQualityIndexBand(1)?.key).toBe("veryGood");
		expect(resolveAirQualityIndexBand(1.99)?.key).toBe("veryGood");
		expect(resolveAirQualityIndexBand(2.87)?.key).toBe("good");
		expect(resolveAirQualityIndexBand(3)?.key).toBe("moderate");
		expect(resolveAirQualityIndexBand(5)?.key).toBe("veryPoor");
		expect(resolveAirQualityIndexBand(5.4)?.key).toBe("veryPoor");
		expect(resolveAirQualityIndexBand(0.5)).toBeUndefined();
		expect(resolveAirQualityIndexBand(Number.NaN)).toBeUndefined();
	});

	it("resolves color and localized labels", () => {
		expect(airQualityIndexBandColor(2.1)).toBe("#50CDAA");
		expect(airQualityIndexBandLabel(4, "de")).toBe("schlecht");
		expect(airQualityIndexBandLabel(4, "en")).toBe("poor");
	});
});
