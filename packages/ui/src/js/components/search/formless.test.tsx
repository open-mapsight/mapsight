import {hydrateRoot} from "react-dom/client";
import {renderToString} from "react-dom/server";
import ReactModal from "react-modal";
import {Provider} from "react-redux";

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import type {MapController} from "@mapsight/core/lib/map/controller";

import {setDocumentLanguage} from "../../helpers/i18n";
import {create} from "../../index";
import SearchOverlay from "../map-overlay/search-overlay";
import Search from "./index";

const dispose: Array<() => void> = [];
afterEach(() => {
	cleanup();
	dispose.splice(0).forEach((fn) => fn());
	vi.unstubAllGlobals();
	setDocumentLanguage("de");
});

function runtime(view: "desktop" | "mobile" = "desktop") {
	setDocumentLanguage("de");
	vi.stubGlobal(
		"fetch",
		vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						type: "FeatureCollection",
						features: [
							{
								type: "Feature",
								id: "street",
								geometry: {
									type: "Point",
									coordinates: [10.52, 52.27],
								},
								properties: {
									name: "Teststraße",
									group: "Straßen",
								},
							},
						],
					}),
					{status: 200},
				),
			),
		),
	);
	const {store} = create(
		null,
		() => undefined,
		{
			app: {view, searchRenderForm: false},
			map: {layers: {}, interactions: {}},
		},
		{
			renderer: vi.fn(),
			validateConfig: false,
			uiState: {
				view,
				searchRenderForm: false,
				searchResult: {
					type: "local",
					data: {type: "FeatureCollection", features: []},
					lastUpdate: null,
					lastActionType: null,
					status: null,
				},
			},
		},
	);
	dispose.push(() =>
		(store!.getController("map") as MapController).getMap()?.dispose(),
	);
	return store!;
}

it("parses and hydrates SearchOverlay inside a CMS form without replacing its SSR root or breaking form ownership", async () => {
	const store = runtime();
	const tree = (
		<Provider store={store}>
			<SearchOverlay />
		</Provider>
	);
	const shell = document.createElement("div");
	// Parse the complete host form just as the browser does on the SSR response.
	shell.innerHTML = `<form id="cms"><input type="hidden" name="position" value="10.52,52.27"><div id="mapsight" class="ms3-wrapper">${renderToString(tree)}</div><button type="submit">Host speichern</button></form>`;
	document.body.append(shell);
	dispose.push(() => shell.remove());
	const form = shell.querySelector("form")!;
	const mount = shell.querySelector<HTMLElement>("#mapsight")!;
	const search = mount.querySelector(".ms3-search")!;
	expect(search.tagName).toBe("DIV");
	expect(shell.querySelectorAll("form")).toHaveLength(1);
	const input = mount.querySelector<HTMLInputElement>("input[type=search]")!;
	const submit = shell.querySelector<HTMLButtonElement>(
		"button[type=submit]",
	)!;
	expect(input.form).toBe(form);
	expect(submit.form).toBe(form);
	const onRecoverableError = vi.fn();
	let root: ReturnType<typeof hydrateRoot>;
	await act(async () => {
		root = hydrateRoot(mount, tree, {onRecoverableError});
		await Promise.resolve();
	});
	dispose.push(() => {
		act(() => root.unmount());
	});
	expect(onRecoverableError).not.toHaveBeenCalled();
	expect(mount.querySelector(".ms3-search")).toBe(search);
	expect(mount.querySelector("input[type=search]")).toBe(input);
	const submissions: FormData[] = [];
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		submissions.push(new FormData(form));
	});
	input.focus();
	fireEvent.change(input, {target: {value: "Teststraße"}});
	// jsdom does not synthesize implicit submit; assert Enter's default action
	// was actually prevented, in addition to checking the submit count.
	expect(fireEvent.keyDown(input, {key: "Enter"})).toBe(false);
	const result = await screen.findByRole("button", {name: "Teststraße"});
	expect(submissions).toHaveLength(0);
	const send = mount.querySelector<HTMLButtonElement>(
		".ms3-search__send-button",
	)!;
	expect(send.type).toBe("button");
	fireEvent.click(send);
	expect(submissions).toHaveLength(0);
	result.focus();
	fireEvent.click(result);
	await waitFor(() => expect(document.activeElement).toBe(input));
	expect(screen.queryByRole("button", {name: "Teststraße"})).toBeNull();
	fireEvent.click(submit);
	expect(submissions).toHaveLength(1);
	expect(submissions[0]!.get("position")).toBe("10.52,52.27");
});

it("passes the configured formless mode into the mobile overlay search", () => {
	const store = runtime("mobile");
	const {container} = render(
		<Provider store={store}>
			<SearchOverlay />
		</Provider>,
	);
	ReactModal.setAppElement(container);
	fireEvent.click(screen.getByRole("button", {name: "Suche öffnen"}));
	expect(screen.getByRole("searchbox").closest(".ms3-search")!.tagName).toBe(
		"DIV",
	);
});

it("keeps form rendering as Search's default and supports direct opt-in", () => {
	const store = runtime();
	const {rerender} = render(
		<Provider store={store}>
			<Search />
		</Provider>,
	);
	expect(screen.getByRole("searchbox").closest(".ms3-search")!.tagName).toBe(
		"FORM",
	);
	rerender(
		<Provider store={store}>
			<Search renderForm={false} />
		</Provider>,
	);
	expect(screen.getByRole("searchbox").closest(".ms3-search")!.tagName).toBe(
		"DIV",
	);
});
