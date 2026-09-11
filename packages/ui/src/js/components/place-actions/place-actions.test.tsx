import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeAll, describe, expect, it, vi} from "vitest";

import {ANIMATE} from "@mapsight/core/lib/map/actions";

import {setDocumentLanguage} from "../../helpers/i18n";
import type {MapsightUiFeature} from "../../types";
import {
	APP_EVENT_SCROLL_TO_MAP,
	AppChannelProvider,
} from "../helping/app-channel";
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

		const link = screen.getByRole("link", {
			name: "Website dieses Ortes öffnen",
		});
		expect(link.getAttribute("href")).toBe(
			"https://www.example.de/schlosspark",
		);
		expect(link.getAttribute("title")).toBeNull();
		expect(link.getAttribute("rel")).toBe("external noreferrer noopener");
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
			name: "Diesen Ort anrufen: +49 531 470 1",
		});
		expect(link.getAttribute("href")).toBe("tel:+495314701");
		expect(link.getAttribute("title")).toBeNull();
		expect(link.textContent).not.toContain("+49");
		expect(link.textContent).not.toContain("531");
	});

	it("keeps a custom call label as the accessible name", () => {
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
				<PlaceActions.Call label="Anrufen" />
			</PlaceActions.Root>,
		);

		expect(screen.getByRole("link", {name: "Anrufen"})).toBeTruthy();
	});

	it("renders the default copy-coords icon wrapper", () => {
		render(
			<PlaceActions.Root
				feature={feature()}
				config={{
					permalink: () => null,
					showOnMap: false,
					copyCoords: true,
					navigation: {fromGeometry: false},
				}}
			>
				<PlaceActions.CopyCoords />
			</PlaceActions.Root>,
		);

		const button = screen.getByRole("button", {
			name: "Diese Koordinaten kopieren",
		});
		expect(button.querySelector(".ms3-place-actions__icon")).not.toBeNull();
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
					showOnMap: false,
					navigation: {fromGeometry: false},
				}}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", {name: "Diesen Ort teilen"}),
		);

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

	it("lists built-in routing services", () => {
		render(
			<FeaturePlaceActions
				feature={feature()}
				config={{
					permalink: () => null,
					showOnMap: false,
					navigation: {supportsGeo: false},
				}}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Zu diesem Ort mit einer anderen App navigieren",
			}),
		);

		expect(
			screen
				.getByRole("link", {name: "Google Maps"})
				.getAttribute("href"),
		).toBe(
			"https://www.google.com/maps/dir/?api=1&destination=52.26,10.52",
		);
		expect(
			screen
				.getByRole("link", {name: "Apple Karten"})
				.getAttribute("href"),
		).toBe("https://maps.apple.com/?daddr=52.26,10.52");
		expect(screen.queryByRole("link", {name: "NUNAV"})).toBeNull();
	});

	it("centers the feature and scrolls to the map when it is off-screen", () => {
		const store = configureStore({
			reducer: {
				app: (state = {mapIsOutOfViewport: true}) => state,
			},
		});
		const dispatch = vi.spyOn(store, "dispatch");
		const onScrollToMap = vi.fn();

		render(
			<Provider store={store}>
				<AppChannelProvider
					listeners={[[APP_EVENT_SCROLL_TO_MAP, onScrollToMap]]}
				>
					<FeaturePlaceActions
						feature={feature()}
						config={{
							permalink: () => null,
							navigation: {fromGeometry: false},
						}}
					/>
				</AppChannelProvider>
			</Provider>,
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Diesen Ort auf der Karte zeigen",
			}),
		);

		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: ANIMATE,
				options: expect.objectContaining({
					maxZoom: 17,
					duration: 500,
				}),
			}),
		);
		expect(onScrollToMap).toHaveBeenCalledTimes(1);
	});

	it("centers the feature without scrolling when the map is on-screen", () => {
		const store = configureStore({
			reducer: {
				app: (state = {mapIsOutOfViewport: false}) => state,
			},
		});
		const dispatch = vi.spyOn(store, "dispatch");
		const onScrollToMap = vi.fn();

		render(
			<Provider store={store}>
				<AppChannelProvider
					listeners={[[APP_EVENT_SCROLL_TO_MAP, onScrollToMap]]}
				>
					<FeaturePlaceActions
						feature={feature()}
						config={{
							permalink: () => null,
							navigation: {fromGeometry: false},
						}}
					/>
				</AppChannelProvider>
			</Provider>,
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Diesen Ort auf der Karte zeigen",
			}),
		);

		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({type: ANIMATE}),
		);
		expect(onScrollToMap).not.toHaveBeenCalled();
	});

	it("keeps copy coordinates off the default place-action row", () => {
		render(
			<FeaturePlaceActions
				feature={feature()}
				config={{
					permalink: () => null,
					showOnMap: false,
					navigation: {fromGeometry: false},
				}}
			/>,
		);

		expect(
			screen.queryByRole("button", {
				name: "Diese Koordinaten kopieren",
			}),
		).toBeNull();
	});

	it("exposes explanatory tooltips on icon-only actions", async () => {
		const store = configureStore({
			reducer: {
				app: (state = {mapIsOutOfViewport: false}) => state,
			},
		});

		render(
			<Provider store={store}>
				<FeaturePlaceActions
					feature={feature()}
					config={{
						permalink:
							"https://example.de/plan?feature=schlosspark",
						navigation: {fromGeometry: false},
					}}
				/>
			</Provider>,
		);

		const share = screen.getByRole("button", {name: "Diesen Ort teilen"});
		expect(share.getAttribute("title")).toBeNull();
		expect(share.textContent).toBe("");
		expect(share.querySelector(".ms3-place-actions__icon")).not.toBeNull();
		fireEvent.pointerMove(document.body, {pointerType: "mouse"});
		fireEvent.pointerEnter(share, {pointerType: "mouse"});
		expect(
			await screen.findByRole("tooltip", {name: "Diesen Ort teilen"}),
		).toBeTruthy();

		const showOnMap = screen.getByRole("button", {
			name: "Diesen Ort auf der Karte zeigen",
		});
		expect(showOnMap.getAttribute("title")).toBeNull();
		fireEvent.pointerLeave(share, {pointerType: "mouse"});
		fireEvent.keyDown(document, {key: "Tab"});
		showOnMap.focus();
		fireEvent.focus(showOnMap);
		expect(
			await screen.findByRole("tooltip", {
				name: "Diesen Ort auf der Karte zeigen",
			}),
		).toBeTruthy();
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
