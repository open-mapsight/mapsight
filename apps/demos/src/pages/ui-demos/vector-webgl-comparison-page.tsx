import {useEffect, useState} from "react";
import {useSelector, useStore} from "react-redux";

import Map from "@mapsight/ui/components/map";
import MapWrapper from "@mapsight/ui/components/map-wrapper";

import {set} from "@mapsight/core/lib/base/actions";
import {setData} from "@mapsight/core/lib/feature-sources/actions";
import type {EnhancedStore} from "@mapsight/core/types";

import {
	VECTOR_WEBGL_CANVAS_LAYER_ID,
	VECTOR_WEBGL_FEATURE_SOURCE_ID,
	VECTOR_WEBGL_WEBGL_LAYER_ID,
	baseMapsightConfig,
	controllerNames,
	createOptions,
	loadChargingStationFeatureCollection,
	styleFunction,
} from "../../ui-demos/vector-webgl-comparison-config.ts";
import {UiDemoShell} from "./ui-demo-shell.tsx";

type RenderMode = "canvas" | "webgl" | "both";

function useSeedFeatureSource(onFeatureCountChange: (count: number) => void) {
	const store = useStore() as EnhancedStore;

	useEffect(() => {
		let cancelled = false;

		void loadChargingStationFeatureCollection().then(
			(featureCollection) => {
				if (cancelled) {
					return;
				}

				store.dispatch(
					setData(
						controllerNames.featureSources,
						VECTOR_WEBGL_FEATURE_SOURCE_ID,
						featureCollection,
					),
				);
				onFeatureCountChange(featureCollection.features.length);
			},
		);

		return () => {
			cancelled = true;
		};
	}, [onFeatureCountChange, store]);
}

function useCanvasLayerVisibility(mode: RenderMode) {
	const store = useStore() as EnhancedStore;

	useEffect(() => {
		store.dispatch(
			set(
				[
					controllerNames.map,
					"layers",
					VECTOR_WEBGL_CANVAS_LAYER_ID,
					"options",
					"visible",
				],
				mode !== "webgl",
			),
		);
		store.dispatch(
			set(
				[
					controllerNames.map,
					"layers",
					VECTOR_WEBGL_WEBGL_LAYER_ID,
					"options",
					"visible",
				],
				mode !== "canvas",
			),
		);
	}, [mode, store]);
}

function VectorWebglComparisonContent() {
	const [mode, setMode] = useState<RenderMode>("canvas");
	const [reduxFeatureCount, setReduxFeatureCount] = useState(0);
	const selectedFeatureId = useSelector(
		(state) =>
			(
				state as {
					featureSelections?: Record<string, {features?: string[]}>;
				}
			).featureSelections?.select?.features?.[0],
	);
	const highlightedFeatureId = useSelector(
		(state) =>
			(
				state as {
					featureSelections?: Record<string, {features?: string[]}>;
				}
			).featureSelections?.highlight?.features?.[0],
	);

	useSeedFeatureSource(setReduxFeatureCount);
	useCanvasLayerVisibility(mode);

	return (
		<>
			<div className="vector-webgl-demo__panel">
				<div>
					<h1>Vector renderer comparison</h1>
					<p>
						Braunschweig charging stations rendered from one
						Mapsight <code>VectorFeatureSource</code>. Canvas uses
						the Mapsight style function; WebGL is configured as a
						Mapsight ol-proxy layer with equivalent OpenLayers flat
						style rules.
					</p>
				</div>
				<div
					className="vector-webgl-demo__controls"
					aria-label="Renderer mode"
				>
					{(["canvas", "webgl", "both"] as const).map((value) => (
						<button
							key={value}
							type="button"
							className={
								mode === value
									? "vector-webgl-demo__button is-active"
									: "vector-webgl-demo__button"
							}
							onClick={() => setMode(value)}
						>
							{value === "canvas"
								? "Canvas"
								: value === "webgl"
									? "WebGL"
									: "Both"}
						</button>
					))}
				</div>
				<dl className="vector-webgl-demo__stats">
					<div>
						<dt>Redux source</dt>
						<dd>{reduxFeatureCount.toLocaleString()} stations</dd>
					</div>
					<div>
						<dt>Integration</dt>
						<dd>Configured Mapsight layers</dd>
					</div>
					<div>
						<dt>Hover</dt>
						<dd>{highlightedFeatureId ?? "none"}</dd>
					</div>
					<div>
						<dt>Selection</dt>
						<dd>{selectedFeatureId ?? "none"}</dd>
					</div>
				</dl>
			</div>
			<MapWrapper>
				<Map />
			</MapWrapper>
		</>
	);
}

export function VectorWebglComparisonPage() {
	return (
		<UiDemoShell
			baseMapsightConfig={baseMapsightConfig}
			createOptions={createOptions}
			styleFunction={styleFunction}
			mergeDefaultPlugins={false}
		>
			<div className="vector-webgl-demo">
				<VectorWebglComparisonContent />
			</div>
		</UiDemoShell>
	);
}
