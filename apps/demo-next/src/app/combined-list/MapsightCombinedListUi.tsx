"use client";

import {useMemo} from "react";

import {createCombinedListDemo} from "@mapsight/demo-shared/combined-list";
import App from "@mapsight/ui/components/app";
import Instance from "@mapsight/ui/components/instance";
import createDefaultBrowserPlugins from "@mapsight/ui/plugins/browser-defaults";
import createLangPlugin from "@mapsight/ui/plugins/common/lang";
import createDefaultServerPlugins from "@mapsight/ui/plugins/server-defaults";
import type {CreateOptions, PluginDefinition} from "@mapsight/ui/types";

import styleFunction from "@/generated/mapsight-vector-styles/demo";

export default function MapsightCombinedListUi() {
	const isClient =
		typeof window !== "undefined" && typeof document !== "undefined";

	const {baseMapsightConfig, createOptions: combinedListOptions} = useMemo(
		() =>
			createCombinedListDemo({
				parks: "/combined-list/parks.geojson",
				cafes: "/combined-list/cafes.geojson",
			}),
		[],
	);

	const createOptions = useMemo<CreateOptions>(
		() => ({
			lang: "en",
			imagesUrl: "/img/",
			plugins: [
				["lang", createLangPlugin()],
				...(combinedListOptions.plugins || []),
				...(isClient
					? createDefaultBrowserPlugins()
					: createDefaultServerPlugins()),
			] as PluginDefinition[],
			uiState: combinedListOptions.uiState,
		}),
		[isClient, combinedListOptions],
	);

	return (
		<div>
			<p>
				<a href="/">&larr; Single-source demo</a>
			</p>
			<h1>Combined list demo</h1>
			<p>
				Toggle <strong>Parks</strong> and <strong>Cafes</strong> in the
				layer switcher. The list shows features from all currently
				visible layers.
			</p>
			<Instance
				baseMapsightConfig={baseMapsightConfig}
				createOptions={createOptions}
				styleFunction={styleFunction}
			>
				<App />
			</Instance>
		</div>
	);
}
