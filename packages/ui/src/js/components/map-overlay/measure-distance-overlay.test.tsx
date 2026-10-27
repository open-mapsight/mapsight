import {cleanup, render} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import {announceStatus} from "../../helpers/announce-status";
import createMeasureDistancePlugin from "../../plugins/common/measure-distance";
import MeasureDistanceInfo from "./measure-distance-overlay";

vi.mock("../../helpers/announce-status", () => ({announceStatus: vi.fn()}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

it("announces a measurement result without repeating it on unrelated renders", () => {
	createMeasureDistancePlugin();
	const feature = {
		geometry: {
			type: "LineString",
			coordinates: [
				[10.52, 52.26],
				[10.53, 52.26],
			],
		},
	};
	const {rerender} = render(<MeasureDistanceInfo feature={feature} />);
	expect(announceStatus).toHaveBeenCalledWith(
		expect.stringMatching(/^Streckenlänge: /),
	);
	rerender(<MeasureDistanceInfo feature={feature} />);
	expect(announceStatus).toHaveBeenCalledTimes(1);
});
