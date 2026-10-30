import type {Root} from "react-dom/client";
import {useSelector} from "react-redux";

import {act} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {updateFeatureProperty} from "@mapsight/core/lib/feature-sources/actions";
import {findFeatureInFeatureSourcesById} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import type {State} from "@mapsight/core/types";

import browserDomRenderer from "../renderer/browser-dom";
import type {MapsightUiRenderer, MapsightUiRendererProps} from "../types";
import browserEmbed from "./browser";
import nodeEmbed from "./node";

const roots: Root[] = [];
const config = {
	map: {layers: {}},
	featureSources: {
		places: {
			type: "local",
			data: {
				type: "FeatureCollection",
				features: [
					{
						type: "Feature",
						id: "selected",
						geometry: {type: "Point", coordinates: [10, 52]},
						properties: {title: "server"},
					},
				],
			},
		},
	},
};

function FeatureProbe() {
	const label = useSelector((state: State) => {
		const sources = state.featureSources as FeatureSourcesState;
		const feature = findFeatureInFeatureSourcesById(sources, "selected");
		return `${sources.places?.ids?.join(",")}: ${feature?.properties.title}`;
	});
	return (
		<button type="button" data-testid="feature-probe">
			{label}
		</button>
	);
}

const uiOptions = {
	validateConfig: false,
	plugins: [],
	uiState: {map: {show: false}, list: {show: false}},
	components: {AppWrapperStart: FeatureProbe},
};

afterEach(async () => {
	await act(async () => {
		await Promise.resolve();
		for (const root of roots.splice(0)) root.unmount();
	});
	document.body.replaceChildren();
	vi.restoreAllMocks();
});

describe("compact SSR React hydration", () => {
	it.each([false, true])(
		"preserves real server DOM and lookup indexes when compact=%s, including an early client edit",
		async (compact) => {
			const errors = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const server = nodeEmbed({
				styleFunction: vi.fn(() => undefined),
				baseMapsightConfig: config,
				createOptions: {...uiOptions},
				compactFeatureSourceIndexes: compact,
			});
			server.render();
			document.body.innerHTML = server.emitFragment({
				id: "compact-hydration",
			});
			const container = document.getElementById("compact-hydration")!;
			const wrapper = container.querySelector(".ms3-wrapper");
			const button = container.querySelector(
				"[data-testid=feature-probe]",
			);
			expect(button?.textContent).toBe("selected: server");
			let snapshot: MapsightUiRendererProps["serverState"];
			const renderer: MapsightUiRenderer<Root | undefined> = (
				...args
			) => {
				snapshot = args[1].serverState;
				const root = browserDomRenderer(...args);
				if (root) roots.push(root);
				return root;
			};
			await act(async () => {
				await Promise.resolve();
				browserEmbed(container, {
					styleFunction: vi.fn(() => undefined),
					baseMapsightConfig: config,
					createOptions: {
						...uiOptions,
						renderer,
						plugins: [
							[
								"earlyEdit",
								{
									afterCreate: ({store}) => {
										store!.dispatch(
											updateFeatureProperty(
												"featureSources",
												"places",
												"selected",
												"title",
												"client",
												{},
											),
										);
									},
								},
							],
						],
					},
				});
			});

			const sources = snapshot?.featureSources as FeatureSourcesState;
			expect(sources.places?.ids).toEqual(["selected"]);
			expect(
				sources.places?.featuresById?.selected?.properties.title,
			).toBe("server");
			expect(container.getAttribute("data-dehydrated-state")).toBe("");
			expect(container.querySelector(".ms3-wrapper")).toBe(wrapper);
			expect(container.querySelector("[data-testid=feature-probe]")).toBe(
				button,
			);
			expect(button?.textContent).toBe("selected: client");
			expect(errors).not.toHaveBeenCalled();
		},
	);
});
