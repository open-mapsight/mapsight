import {StrictMode} from "react";
import {type Root, hydrateRoot} from "react-dom/client";
import {renderToString} from "react-dom/server";

import {act, cleanup} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import App from "../components/app";
import AppContext from "../components/helping/app-context";
import {create} from "../index";
import type {CreateOptions, MapsightUiRendererProps} from "../types";

const styleFunction = () => undefined;
const config = {
	map: {
		layers: {
			places: {
				type: "VectorLayer",
				metaData: {title: "Places", group: "Places"},
				options: {visible: true},
			},
		},
	},
};
const roots: Root[] = [];

function app(options: CreateOptions = {}) {
	const context = create(null, styleFunction, config, {
		validateConfig: false,
		...options,
		uiState: {
			view: "desktop",
			title: "Map title",
			map: {show: false},
			list: {show: false},
			layerSwitcher: {
				show: {external: true},
				external: {grouped: true, layerIdsSelector: () => ["places"]},
			},
			...options.uiState,
		},
		renderer: (_container, props) => props,
	});
	const props = context.render?.({}) as MapsightUiRendererProps;
	return (
		<AppContext {...props}>
			<App />
		</AppContext>
	);
}

afterEach(async () => {
	await act(async () => {
		await Promise.resolve();
		for (const root of roots.splice(0)) root.unmount();
	});
	cleanup();
	document.body.replaceChildren();
	vi.restoreAllMocks();
});

describe("heading integration", () => {
	it.each([
		{showTitle: false, expected: 2},
		{showTitle: true, expected: 3},
	])(
		"configures App switchers through create options: %j",
		({showTitle, expected}) => {
			const host = document.createElement("div");
			host.innerHTML = renderToString(
				app({
					headings: {baseLevel: 2},
					uiState: {pageTitle: {show: showTitle}},
				}),
			);
			expect(host.querySelector(".ms3-switcher-header")?.tagName).toBe(
				`H${expected}`,
			);
			if (showTitle)
				expect(
					host.querySelector(".ms3-page-title__headline")?.tagName,
				).toBe("H2");
		},
	);

	it("hydrates the same native heading elements without recovering or replacing them", async () => {
		const tree = () => (
			<StrictMode>
				{app({
					headings: {baseLevel: 3},
					uiState: {pageTitle: {show: true}},
				})}
			</StrictMode>
		);
		const container = document.createElement("div");
		container.innerHTML = renderToString(tree());
		document.body.append(container);
		const before = [...container.querySelectorAll("h1,h2,h3,h4,h5,h6")];
		expect(before.map((node) => node.tagName)).toEqual(["H3", "H4"]);
		const recover = vi.fn();
		await act(async () => {
			roots.push(
				hydrateRoot(container, tree(), {onRecoverableError: recover}),
			);
			await Promise.resolve();
		});
		expect([...container.querySelectorAll("h1,h2,h3,h4,h5,h6")]).toEqual(
			before,
		);
		for (const node of before) expect(node.isConnected).toBe(true);
		expect(recover).not.toHaveBeenCalled();
	});
});
