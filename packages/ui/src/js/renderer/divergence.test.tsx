import type {ReactElement} from "react";
import {type Root, hydrateRoot} from "react-dom/client";
import {renderToString} from "react-dom/server";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import BottomSheet from "../components/bottom-sheet";
import {defaultViewportSnapHeights} from "../components/bottom-sheet/snap";
import LinkShare from "../components/link-share";
import MeasureDistanceInfo from "../components/map-overlay/measure-distance-overlay";
import NativeDialog from "../components/native-dialog";
import TimeFilter from "../components/time-filter";
import {setDocumentLanguage} from "../helpers/i18n";
import {useMapsightIcon} from "../hooks/useMapsightIcon";

vi.mock("@mapsight/traffic-style/runtime", () => ({
	mapsightIconCacheKey: () => "cached-icon",
	getCachedIcon: () => ({dataUrl: "data:image/png;base64,cached"}),
	loadIcon: vi.fn(),
}));

const roots: Root[] = [];
afterEach(async () => {
	await act(async () => {
		await Promise.resolve();
		for (const root of roots.splice(0)) root.unmount();
	});
	cleanup();
	document.body.replaceChildren();
	setDocumentLanguage("de");
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

async function hydrate(ui: ReactElement, html: string) {
	const errors = vi.spyOn(console, "error").mockImplementation(() => {});
	const container = document.createElement("div");
	container.innerHTML = html;
	document.body.append(container);
	const firstNode = container.firstChild;
	await act(async () => {
		await Promise.resolve();
		roots.push(hydrateRoot(container, ui, {onRecoverableError: errors}));
	});
	expect(container.firstChild).toBe(firstNode);
	expect(errors).not.toHaveBeenCalled();
	return container;
}

it("hydrates inline and portal dialogs and enables native sharing after commit", async () => {
	vi.stubGlobal("navigator", {
		...navigator,
		share: vi.fn().mockResolvedValue(undefined),
	});
	const ui = (
		<div>
			<NativeDialog isOpen={false} title="Inline" onClose={vi.fn()}>
				Inline content
			</NativeDialog>
			<NativeDialog
				isOpen={false}
				portal
				title="Portal"
				onClose={vi.fn()}
			>
				Portal content
			</NativeDialog>
			<LinkShare
				url="https://example.org"
				onFinished={undefined}
				onError={undefined}
			/>
		</div>
	);
	const html = renderToString(ui);
	expect(html).toContain("Inline content");
	expect(html).not.toContain("Portal content");
	expect(html).not.toContain("ms3-link-share__button");
	const container = await hydrate(ui, html);
	expect(container.querySelector(".ms3-link-share__button")).not.toBeNull();
	expect(document.body.textContent).toContain("Portal content");
});

it("keeps viewport-dependent snap factories out of the initial render", async () => {
	const snaps = vi.fn(() => defaultViewportSnapHeights(window.innerHeight));
	const ui = (
		<BottomSheet label="Details" snaps={snaps}>
			Content
		</BottomSheet>
	);
	const html = renderToString(ui);
	expect(snaps).not.toHaveBeenCalled();
	vi.stubGlobal("innerHeight", 320);
	const container = await hydrate(ui, html);
	expect(snaps).toHaveBeenCalled();
	expect(
		container.querySelector("[role=region]")?.getAttribute("style"),
	).toContain("height: 140px");
});

function CachedIcon() {
	const icon = useMapsightIcon("cached-icon");
	return <span data-loading={icon.loading}>{icon.src ?? "pending"}</span>;
}

it("uses the same icon placeholder even when the browser cache is warm", async () => {
	const ui = <CachedIcon />;
	const html = renderToString(ui);
	expect(html).toContain("pending");
	const container = await hydrate(ui, html);
	expect(container.textContent).toBe("data:image/png;base64,cached");
});

it("renders serialized dates and measurements with explicit UTC dates and UI locale", async () => {
	setDocumentLanguage("de");
	const store = configureStore({
		reducer: () => ({
			timeFilter: {fromDate: "2026-10-27T23:30:00-02:00", toDate: null},
		}),
	});
	const ui = (
		<Provider store={store}>
			<TimeFilter />
			<MeasureDistanceInfo
				feature={{
					type: "Feature",
					geometry: {
						type: "LineString",
						coordinates: [
							[10, 52],
							[10.001, 52],
						],
					},
				}}
			/>
		</Provider>
	);
	const html = renderToString(ui);
	expect(html).toContain('value="28.10.2026"');
	await hydrate(ui, html);
});
