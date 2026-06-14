"use client";

import {useMemo} from "react";

import App from "@mapsight/ui/components/app";
import Instance from "@mapsight/ui/components/instance";
import createDefaultBrowserPlugins from "@mapsight/ui/plugins/browser-defaults";
import createDefaultServerPlugins from "@mapsight/ui/plugins/server-defaults";
import type {CreateOptions} from "@mapsight/ui/types";

import styleFunction from "@/generated/mapsight-vector-styles/demo";
import {baseMapsightConfig} from "@/mapsight/map-config";

export function MapPage() {
	const isClient =
		typeof window !== "undefined" && typeof document !== "undefined";
	const createOptions = useMemo<CreateOptions>(
		() => ({
			lang: "en",
			imagesUrl: "/img/",
			plugins: isClient
				? createDefaultBrowserPlugins()
				: createDefaultServerPlugins(),
			uiState: {
				map: {show: true},
				list: {show: true},
			},
		}),
		[isClient],
	);

	return (
		<section className="map-page">
			<h1>Mapsight map</h1>
			<div className="map-page__frame">
				<Instance
					baseMapsightConfig={baseMapsightConfig}
					createOptions={createOptions}
					styleFunction={styleFunction}
				>
					<App />
				</Instance>
			</div>
		</section>
	);
}
