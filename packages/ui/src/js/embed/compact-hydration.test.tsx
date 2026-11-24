import type {Root} from "react-dom/client";
import {useSelector} from "react-redux";

import {act} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {
	removeFeature,
	updateFeatureProperty,
} from "@mapsight/core/lib/feature-sources/actions";
import {findFeatureInFeatureSourcesById} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import type {State} from "@mapsight/core/types";

import {create} from "../index";
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

const configWithExtraFeature = {
	...config,
	featureSources: {
		places: {
			...config.featureSources.places,
			data: {
				...config.featureSources.places.data,
				features: [
					...config.featureSources.places.data.features,
					{
						type: "Feature",
						id: "drop",
						geometry: {type: "Point", coordinates: [11, 52]},
						properties: {title: "removed"},
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
		"preserves a server feature deletion when compact=%s",
		async (compact) => {
			const errors = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const server = nodeEmbed({
				styleFunction: vi.fn(() => undefined),
				baseMapsightConfig: configWithExtraFeature,
				createOptions: {...uiOptions},
				compactFeatureSourceIndexes: compact,
			});
			server.store?.dispatch(
				removeFeature("featureSources", "places", "drop"),
			);
			document.body.innerHTML = server.emitFragment({
				id: "deleted-feature",
			});
			const container = document.getElementById("deleted-feature")!;
			const button = container.querySelector(
				"[data-testid=feature-probe]",
			);
			expect(button?.textContent).toBe("selected: server");

			let hydrated: MapsightUiRendererProps | undefined;
			const renderer: MapsightUiRenderer<Root | undefined> = (
				...args
			) => {
				hydrated = args[1];
				const root = browserDomRenderer(...args);
				if (root) roots.push(root);
				return root;
			};
			await act(async () => {
				await Promise.resolve();
				browserEmbed(container, {
					styleFunction: vi.fn(() => undefined),
					baseMapsightConfig: {
						...configWithExtraFeature,
						featureSources: {
							...configWithExtraFeature.featureSources,
							clientOnly: {type: "local", data: null},
						},
					},
					createOptions: {...uiOptions, renderer},
				});
			});

			for (const state of [
				hydrated?.serverState,
				hydrated?.store.getState(),
			]) {
				const sources = state?.featureSources as FeatureSourcesState;
				expect(
					sources.places?.data?.features?.map(({id}) => id),
				).toEqual(["selected"]);
				expect(sources.places?.ids).toEqual(["selected"]);
				expect(sources.places?.featuresById?.drop).toBeUndefined();
				expect(sources.clientOnly?.type).toBe("local");
			}
			expect(container.querySelector("[data-testid=feature-probe]")).toBe(
				button,
			);
			expect(button?.textContent).toBe("selected: server");
			expect(errors).not.toHaveBeenCalled();
		},
	);

	it("retains omitted feature entries in a legacy partial overlay", () => {
		const context = create(
			null,
			vi.fn(() => undefined),
			configWithExtraFeature,
			{
				...uiOptions,
				renderer: vi.fn(),
				reHydratedState: {
					app: {},
					featureSources: {
						places: {data: config.featureSources.places.data},
					},
				},
			},
		);
		const sources = context.store?.getState()
			.featureSources as FeatureSourcesState;
		expect(sources.places?.ids).toEqual(["selected", "drop"]);
	});

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
