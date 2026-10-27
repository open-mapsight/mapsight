import {StrictMode} from "react";
import {type Root, hydrateRoot} from "react-dom/client";
import {renderToString} from "react-dom/server";

import {act, cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import App from "../components/app";
import AppContext from "../components/helping/app-context";
import Instance from "../components/instance";
import {NonReplaceableTitleBar} from "../components/layout/title-bar";
import {useContextComponentWithFallback} from "../helpers/components";
import {create} from "../index";
import type {CreateOptions, MapsightUiRendererProps} from "../types";
import {Heading, HeadingLevel, useHeadingLevel} from "./index";

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
const automatic = {v8_automaticHeadings: true};

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
		{future: undefined, showTitle: false, expected: 3},
		{future: {v8_automaticHeadings: false}, showTitle: true, expected: 3},
		{future: automatic, showTitle: false, expected: 2},
		{future: automatic, showTitle: true, expected: 3},
	])(
		"configures App switchers through create options: %j",
		({future, showTitle, expected}) => {
			const host = document.createElement("div");
			host.innerHTML = renderToString(
				app({
					future,
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

	it("does not create a parent scope for an empty title or a non-heading title override", () => {
		const host = document.createElement("div");
		host.innerHTML = renderToString(
			app({
				future: automatic,
				uiState: {title: "", pageTitle: {show: true}},
			}),
		);
		expect(host.querySelector(".ms3-page-title__headline")).toBeNull();
		expect(host.querySelector(".ms3-switcher-header")?.tagName).toBe("H2");
		host.innerHTML = renderToString(
			app({
				future: automatic,
				headings: {overrides: {appTitle: "div"}},
				uiState: {pageTitle: {show: true}},
			}),
		);
		expect(host.querySelector(".ms3-page-title__headline")?.tagName).toBe(
			"DIV",
		);
		expect(host.querySelector(".ms3-switcher-header")?.tagName).toBe("H2");
	});

	it("configures time-filter headings and respects slot overrides through App", () => {
		const host = document.createElement("div");
		host.innerHTML = renderToString(
			app({
				future: automatic,
				headings: {baseLevel: 3},
				uiState: {timeFilter: {show: true}, pageTitle: {show: false}},
			}),
		);
		expect(host.querySelector(".ms3-timefilter > h3")).toBeTruthy();
		host.innerHTML = renderToString(
			app({
				future: automatic,
				headings: {baseLevel: 3, overrides: {timeFilter: "div"}},
				uiState: {timeFilter: {show: true}, pageTitle: {show: false}},
			}),
		);
		expect(host.querySelector(".ms3-timefilter > div")).toBeTruthy();
		expect(host.querySelector(".ms3-timefilter > h3")).toBeNull();
	});

	it("passes the scope through component replacements and legacy fallback hooks", () => {
		function OverlayReplacement() {
			const level = useHeadingLevel(4);
			return <Heading data-rank={level}>Replacement overlay</Heading>;
		}
		function AdditionalReplacement() {
			const overlay =
				useContextComponentWithFallback("MapOverlayTopLeft");
			return <>{overlay()}</>;
		}
		const host = document.createElement("div");
		host.innerHTML = renderToString(
			app({
				future: automatic,
				headings: {baseLevel: 3},
				uiState: {pageTitle: {show: true}},
				components: {
					TitleBar: NonReplaceableTitleBar,
					AdditionalContainerContent: AdditionalReplacement,
					MapOverlayTopLeft: OverlayReplacement,
				},
			}),
		);
		expect(host.querySelector(".ms3-page-title__headline")?.tagName).toBe(
			"H3",
		);
		expect(host.querySelector('[data-rank="4"]')?.tagName).toBe("H4");
	});

	it("hydrates the same native heading elements without recovering or replacing them", async () => {
		const tree = () => (
			<StrictMode>
				{app({
					future: automatic,
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

	it("isolates composed and nested Instances and supports host-owned h2 sections", () => {
		const first: CreateOptions = {
			validateConfig: false,
			future: automatic,
			headings: {baseLevel: 4},
		};
		const second: CreateOptions = {
			validateConfig: false,
			future: automatic,
		};
		render(
			<Instance
				styleFunction={styleFunction}
				baseMapsightConfig={config}
				createOptions={first}
			>
				<Heading>First instance</Heading>
				<HeadingLevel level={3}>
					<h2>Search</h2>
					<Heading>Search group</Heading>
				</HeadingLevel>
				<Instance
					styleFunction={styleFunction}
					baseMapsightConfig={config}
					createOptions={second}
				>
					<Heading>Second instance</Heading>
				</Instance>
				<Heading>First sibling</Heading>
			</Instance>,
		);
		expect(
			screen.getByRole("heading", {name: "First instance", level: 4}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Search group", level: 3}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Second instance", level: 2}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "First sibling", level: 4}),
		).toBeTruthy();
	});
});
