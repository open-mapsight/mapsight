import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, beforeAll, describe, expect, it, vi} from "vitest";

import {Heading, HeadingsProvider} from "../headings";
import NativeDialog from "./native-dialog";

vi.mock("./close-overlay-button", () => ({
	default: function MockClose({onClose}: {onClose?: () => void}) {
		return (
			<button type="button" onClick={onClose}>
				close
			</button>
		);
	},
}));

function polyfillDialog(): void {
	const proto = HTMLDialogElement.prototype;
	if (typeof proto.showModal === "function") {
		return;
	}

	Object.defineProperty(proto, "open", {
		configurable: true,
		get(this: HTMLDialogElement) {
			return this.hasAttribute("open");
		},
		set(this: HTMLDialogElement, value: boolean) {
			if (value) {
				this.setAttribute("open", "");
			} else {
				this.removeAttribute("open");
			}
		},
	});

	proto.showModal = function showModal(this: HTMLDialogElement) {
		this.open = true;
	};
	proto.close = function close(this: HTMLDialogElement) {
		this.open = false;
		this.dispatchEvent(new Event("close"));
	};
}

describe("NativeDialog", () => {
	beforeAll(() => {
		polyfillDialog();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders a labelled dialog with title and body", () => {
		render(
			<NativeDialog isOpen title="Layers" onClose={vi.fn()}>
				<div>switcher</div>
			</NativeDialog>,
		);

		expect(screen.getByRole("heading", {name: "Layers"})).toBeTruthy();
		expect(screen.getByText("switcher")).toBeTruthy();
		expect(screen.getByRole("dialog").hasAttribute("open")).toBe(true);
	});

	it("starts a modal scope independently of the page and advances only after a title", () => {
		const {rerender} = render(
			<HeadingsProvider options={{baseLevel: 5}}>
				<NativeDialog isOpen title="Layers" onClose={vi.fn()}>
					<Heading>Group</Heading>
				</NativeDialog>
			</HeadingsProvider>,
		);
		expect(
			screen.getByRole("heading", {name: "Layers", level: 2}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Group", level: 3}),
		).toBeTruthy();
		expect(screen.getByRole("dialog", {name: "Layers"})).toBeTruthy();
		rerender(
			<HeadingsProvider options={{baseLevel: 5}}>
				<NativeDialog isOpen aria-label="Layers" onClose={vi.fn()}>
					<Heading>Group</Heading>
				</NativeDialog>
			</HeadingsProvider>,
		);
		expect(
			screen.getByRole("heading", {name: "Group", level: 2}),
		).toBeTruthy();
	});

	it("portals to document.body when portal is true", () => {
		render(
			<div data-testid="host">
				<NativeDialog isOpen portal title="Search" onClose={vi.fn()}>
					field
				</NativeDialog>
			</div>,
		);

		const host = screen.getByTestId("host");
		expect(host.querySelector("dialog")).toBeNull();
		expect(document.body.querySelector("dialog")).not.toBeNull();
	});

	it("names the dialog with aria-label when title is omitted", () => {
		render(
			<NativeDialog
				isOpen
				aria-label="Search"
				hideCloseButton
				onClose={vi.fn()}
			>
				field
			</NativeDialog>,
		);

		expect(screen.getByRole("dialog", {name: "Search"})).toBeTruthy();
		expect(screen.queryByRole("heading")).toBeNull();
	});

	it("names the dialog from labelledBy when title is omitted", () => {
		render(
			<NativeDialog
				isOpen
				labelledBy="search-heading"
				hideCloseButton
				onClose={vi.fn()}
			>
				<h2 id="search-heading">Find a place</h2>
			</NativeDialog>,
		);

		expect(screen.getByRole("dialog", {name: "Find a place"})).toBeTruthy();
	});
});
