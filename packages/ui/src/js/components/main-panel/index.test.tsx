import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import type {MainPanelContextValue} from "../../types";
import {useMainPanelContext} from "./context";
import MainPanel from "./index";

vi.mock("./context", () => ({useMainPanelContext: vi.fn()}));
vi.mock("../feature-list", () => ({
	default: ({enableKeyboardControl}: {enableKeyboardControl: boolean}) => (
		<button type="button" data-enabled={enableKeyboardControl}>
			list
		</button>
	),
}));
vi.mock("../feature-selection-info", () => ({
	default: ({
		enableKeyboardControl,
		isOpen,
	}: {
		enableKeyboardControl: boolean;
		isOpen: boolean;
	}) => (
		<button
			type="button"
			data-enabled={enableKeyboardControl}
			data-open={isOpen}
		>
			details
		</button>
	),
}));

const open: MainPanelContextValue = {
	showSelectionInfo: true,
	showList: true,
	collapsible: false,
	panelPosition: "left",
	contentType: "selectionInfo",
	collapsed: false,
	feature: {
		id: "place",
		type: "Feature",
		geometry: null,
		properties: {name: "Place"},
	},
};

afterEach(cleanup);

describe("MainPanel collapse", () => {
	it("makes retained content inert and updates keyboard props immediately on close", () => {
		vi.mocked(useMainPanelContext).mockReturnValue(open);
		const {container, rerender} = render(<MainPanel />);
		expect(screen.getByText("details").getAttribute("data-enabled")).toBe(
			"true",
		);
		vi.mocked(useMainPanelContext).mockReturnValue({
			...open,
			collapsed: true,
			contentType: null,
			feature: null,
		});
		rerender(<MainPanel />);
		const inner = container.querySelector(".ms3-panel__inner")!;
		expect(inner.hasAttribute("inert")).toBe(true);
		expect(screen.getByText("details").getAttribute("data-open")).toBe(
			"false",
		);
		expect(inner.getAttribute("aria-hidden")).toBe("true");
		expect(screen.getByText("details").getAttribute("data-enabled")).toBe(
			"false",
		);
		expect(screen.getByText("list").getAttribute("data-enabled")).toBe(
			"false",
		);
		vi.mocked(useMainPanelContext).mockReturnValue(open);
		rerender(<MainPanel />);
		expect(inner.hasAttribute("inert")).toBe(false);
		expect(screen.getByText("details").getAttribute("data-enabled")).toBe(
			"true",
		);
	});
	it("does not mount an unused hidden list in a selection-only panel", () => {
		vi.mocked(useMainPanelContext).mockReturnValue({
			...open,
			showList: false,
		});
		render(<MainPanel />);
		expect(screen.queryByText("list")).toBeNull();
		expect(screen.getByText("details")).toBeTruthy();
	});
});
