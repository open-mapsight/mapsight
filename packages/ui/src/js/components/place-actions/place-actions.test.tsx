import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeAll, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
import type {MapsightUiFeature} from "../../types";
import FeaturePlaceActions from "./feature-place-actions";
import PlaceActions from "./place-actions";
import type {PlaceActionsConfig} from "./types";

vi.mock("../popover-dialog", () => ({
	default: function MockPopover({
		isOpen,
		children,
	}: {
		isOpen: boolean;
		children?: React.ReactNode;
	}) {
		if (!isOpen) {
			return null;
		}
		return <div role="dialog">{children}</div>;
	},
}));

vi.mock("../close-overlay-button", () => ({
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

function feature(
	overrides: Partial<MapsightUiFeature> & {
		properties?: Record<string, unknown>;
	} = {},
): MapsightUiFeature {
	return {
		type: "Feature",
		id: "schlosspark",
		geometry: {type: "Point", coordinates: [10.52, 52.26]},
		...overrides,
		properties: {
			id: "schlosspark",
			name: "Schlosspark",
			...overrides.properties,
		},
	} as MapsightUiFeature;
}

const isolated: PlaceActionsConfig = {
	permalink: () => null,
	navigation: {fromGeometry: false},
};

describe("PlaceActions", () => {
	beforeAll(() => {
		polyfillDialog();
	});

	afterEach(() => {
		cleanup();
		setDocumentLanguage("de");
		vi.unstubAllGlobals();
	});

	it("renders nothing when no actions resolve", () => {
		const {container} = render(
			<PlaceActions.Root
				feature={feature({
					geometry: {type: "Point", coordinates: []},
					properties: {id: "schlosspark"},
				})}
				config={isolated}
			>
				<PlaceActions.Share />
				<PlaceActions.Navigate />
				<PlaceActions.Website />
				<PlaceActions.Call />
			</PlaceActions.Root>,
		);

		expect(container.textContent).toBe("");
		expect(container.querySelector("nav")).toBeNull();
	});

	it("sets website rel and target", () => {
		render(
			<PlaceActions.Root
				feature={feature({
					properties: {
						id: "schlosspark",
						schema: {url: "https://www.example.de/schlosspark"},
					},
				})}
				config={isolated}
			>
				<PlaceActions.Website />
			</PlaceActions.Root>,
		);

		const link = screen.getByRole("link", {name: "Website"});
		expect(link.getAttribute("href")).toBe(
			"https://www.example.de/schlosspark",
		);
		expect(link.getAttribute("rel")).toBe("external noreferrer");
		expect(link.getAttribute("target")).toBe("_blank");
	});

	it("puts the phone number in the call accessible name only", () => {
		render(
			<PlaceActions.Root
				feature={feature({
					properties: {
						id: "schlosspark",
						schema: {telephone: "+49 531 470 1"},
					},
				})}
				config={isolated}
			>
				<PlaceActions.Call />
			</PlaceActions.Root>,
		);

		const link = screen.getByRole("link", {
			name: "Anrufen +49 531 470 1",
		});
		expect(link.getAttribute("href")).toBe("tel:+495314701");
		expect(link.textContent).toBe("Anrufen");
		expect(link.textContent).not.toContain("+49");
		expect(link.textContent).not.toContain("531");
	});

	it("opens a copy-only share dialog when Web Share is unavailable", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", {
			...window.navigator,
			share: undefined,
			clipboard: {writeText},
		});

		render(
			<FeaturePlaceActions
				feature={feature()}
				config={{
					permalink: "https://example.de/plan?feature=schlosspark",
					navigation: {fromGeometry: false},
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", {name: "Teilen"}));

		expect(screen.getByRole("dialog")).toBeTruthy();
		const permalink = screen.getByRole("link", {
			name: "https://example.de/plan?feature=schlosspark",
		});
		expect(permalink.getAttribute("href")).toBe(
			"https://example.de/plan?feature=schlosspark",
		);

		fireEvent.click(screen.getByRole("button", {name: "Link kopieren"}));
		await vi.waitFor(() => {
			expect(writeText).toHaveBeenCalledWith(
				"https://example.de/plan?feature=schlosspark",
			);
		});
	});

	it("keeps a permalink anchor in the document for share", () => {
		render(
			<PlaceActions.Root
				feature={feature()}
				config={{
					permalink: "https://example.de/plan?feature=schlosspark",
					navigation: {fromGeometry: false},
				}}
			>
				<PlaceActions.Share />
			</PlaceActions.Root>,
		);

		const permalink = screen.getByRole("link", {
			name: "Permalink",
			hidden: true,
		});
		expect(permalink.getAttribute("href")).toBe(
			"https://example.de/plan?feature=schlosspark",
		);
	});
});
