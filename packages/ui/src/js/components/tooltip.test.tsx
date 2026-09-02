import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import Tooltip from "./tooltip";

afterEach(cleanup);

describe("Tooltip", () => {
	it("shows the tooltip text on hover", async () => {
		render(
			<Tooltip text="Share this place" className="demo-tooltip">
				<button type="button" aria-label="Share this place" />
			</Tooltip>,
		);

		const trigger = screen.getByRole("button", {name: "Share this place"});
		expect(trigger.getAttribute("title")).toBeNull();
		expect(screen.queryByRole("tooltip")).toBeNull();

		fireEvent.pointerMove(document.body, {pointerType: "mouse"});
		fireEvent.pointerEnter(trigger, {pointerType: "mouse"});

		const tooltip = await screen.findByRole("tooltip", {
			name: "Share this place",
		});
		expect(tooltip.className).toContain("demo-tooltip");
	});

	it("defaults to the structural control-tooltip class", async () => {
		render(
			<Tooltip text="Zoom in">
				<button type="button" aria-label="Zoom in" />
			</Tooltip>,
		);

		const trigger = screen.getByRole("button", {name: "Zoom in"});
		fireEvent.pointerMove(document.body, {pointerType: "mouse"});
		fireEvent.pointerEnter(trigger, {pointerType: "mouse"});

		expect(
			(await screen.findByRole("tooltip", {name: "Zoom in"})).className,
		).toContain("ms3-control-tooltip");
	});

	it("dismisses on Escape", async () => {
		render(
			<Tooltip text="Zoom in">
				<button type="button" aria-label="Zoom in" />
			</Tooltip>,
		);

		const trigger = screen.getByRole("button", {name: "Zoom in"});
		fireEvent.pointerMove(document.body, {pointerType: "mouse"});
		fireEvent.pointerEnter(trigger, {pointerType: "mouse"});
		await screen.findByRole("tooltip", {name: "Zoom in"});

		fireEvent.keyDown(trigger, {key: "Escape"});
		expect(screen.queryByRole("tooltip")).toBeNull();
	});
});
