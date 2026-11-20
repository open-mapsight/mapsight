import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {ChartContainer, ChartTooltipContent} from "./chart.js";

afterEach(cleanup);

const config = {
	level: {
		label: "Long station label (Average)",
		tooltipLabel: "sensor-1 · Average",
		color: "red",
	},
};
const payload = [
	{dataKey: "level", color: "red", value: 0, payload: {date: 123}},
];

describe("ChartTooltipContent", () => {
	it.each([undefined, false, true])(
		"keeps full labels unless compact is true (%s)",
		(compact) => {
			const {container} = render(
				<ChartContainer config={config}>
					<ChartTooltipContent
						active
						payload={payload}
						compact={compact}
						labelFormatter={(date) => `Date ${date}`}
						valueFormatter={(value) => `${value} m`}
					/>
				</ChartContainer>,
			);
			expect(
				screen.getByText(
					compact
						? "sensor-1 · Average"
						: "Long station label (Average)",
				),
			).toBeTruthy();
			expect(
				screen.getByTitle("Long station label (Average)"),
			).toBeTruthy();
			expect(screen.getByText("0 m")).toBeTruthy();
			expect(screen.getByText("Date 123")).toBeTruthy();
			expect(
				container.querySelector('[style="background-color: red;"]'),
			).toBeTruthy();
		},
	);

	it("omits gaps and non-finite values without formatting them", () => {
		const formatter = vi.fn((value: number) => `${value} m`);
		render(
			<ChartContainer config={config}>
				<ChartTooltipContent
					active
					payload={[
						...payload,
						...[null, undefined, NaN, Infinity].map((value, i) => ({
							dataKey: `gap-${i}`,
							name: `Missing ${i}`,
							value,
						})),
					]}
					valueFormatter={formatter}
				/>
			</ChartContainer>,
		);
		expect(formatter).toHaveBeenCalledExactlyOnceWith(0);
		expect(screen.queryByText(/Missing/)).toBeNull();
	});

	it("renders no tooltip for a bucket containing only gaps", () => {
		const {container} = render(
			<ChartContainer config={config}>
				<ChartTooltipContent
					active
					payload={[{dataKey: "level", value: null}]}
				/>
			</ChartContainer>,
		);
		expect(container.textContent).toBe("");
	});
});
