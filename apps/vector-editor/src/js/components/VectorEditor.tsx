import {useCallback, useLayoutEffect, useRef, useState} from "react";
import {Provider} from "react-redux";
import {Tooltip} from "react-tooltip";

import type {AnyAction} from "@reduxjs/toolkit";

import {
	STATUS_OK,
	getFeatureSourceStatus,
} from "@mapsight/core/lib/feature-sources/selectors";
import {
	fitMapViewToLayerSourceExtent,
	updateMapSize,
} from "@mapsight/core/lib/map/actions";
import {makeFeatureSourceFromLayerIdSelector} from "@mapsight/core/lib/map/selectors";
import type EditorMixin from "@mapsight/core/mixins/EditorMixin";
import type {EnhancedStore} from "@mapsight/core/types";

import {DEFAULT_OPTIONS as FIT_DEFAULT_OPTIONS} from "@mapsight/lib-ol/map/fitToFeatures";
import {
	AbortObserving,
	getAndObserveState,
} from "@mapsight/lib-redux/observe-state";

import VectorEditorContext from "../contexts/VectorEditor.ts";
import useLocalStorage from "../hooks/useLocalStorage.ts";
import MapsightMap from "./Map.tsx";
import ActionControls from "./vector-editor/ActionControls.tsx";
import Button from "./vector-editor/Button.tsx";
import Container from "./vector-editor/Container.tsx";
import Controls from "./vector-editor/Controls.tsx";
//import EditorOptions from './vector-editor/EditorOptions';
import FeatureList from "./vector-editor/FeatureList.tsx";
import HistoryControls from "./vector-editor/HistoryControls.tsx";
import MapOverlay from "./vector-editor/MapOverlay.tsx";
import MapOverlayBox from "./vector-editor/MapOverlayBox.tsx";
import ModeControls from "./vector-editor/ModeControls.tsx";
import PanelConfigurationControls from "./vector-editor/PanelConfigurationControls.tsx";
import Panels from "./vector-editor/Panels.tsx";
import ViewInfo from "./vector-editor/ViewInfo.tsx";
import VisuallyHidden from "./vector-editor/VisuallyHidden.tsx";
import {EDITOR_PANEL_CONFIGURATION} from "./vector-editor/config.ts";

const getUniqueId = () =>
	globalThis.crypto?.randomUUID?.() ??
	`${Date.now()}-${Math.random().toString(36).slice(2)}`;

function makeMapVectorLayerFeatureSourceStatusSelector(
	controllerName: string,
	layerId: string,
) {
	const fSSelector = makeFeatureSourceFromLayerIdSelector(layerId);
	return (state: any) => {
		const fsState = fSSelector(state[controllerName], state);
		return fsState ? getFeatureSourceStatus(fsState) : null;
	};
}

function dispatchOnLayerVFSReady(
	store: EnhancedStore,
	mapControllerName: string,
	layerId: string,
	action: AnyAction,
) {
	const statusSelector = makeMapVectorLayerFeatureSourceStatusSelector(
		mapControllerName,
		layerId,
	);
	getAndObserveState(store, statusSelector, (status) => {
		if (status === STATUS_OK) {
			store.dispatch(action);
			return AbortObserving;
		}
	});
}

function VectorEditor({editor}: {editor: EditorMixin}) {
	const [mapId] = useState(() => `ms3-vector-editor-map--${getUniqueId()}`);
	const [panelConfiguration, setPanelConfiguration] = useLocalStorage(
		"ms3-vector-editor-panel-configuration",
		EDITOR_PANEL_CONFIGURATION.MAP,
	);

	const fitMap = useCallback(
		function () {
			const {
				store,
				controllers: {map},
				ids: {layer: layerId},
			} = editor;
			if (!map || !layerId) {
				return;
			}

			store.dispatch(
				fitMapViewToLayerSourceExtent(map, layerId, {
					...FIT_DEFAULT_OPTIONS,
					maxZoom: 17,
				}),
			);
		},
		[editor],
	);

	const refIsFitted = useRef(false);
	useLayoutEffect(
		function () {
			editor.store.dispatch(updateMapSize(editor.controllers.map!));

			if (!refIsFitted.current) {
				refIsFitted.current = true;
				const {
					store,
					controllers: {map},
					ids: {layer: layerId},
				} = editor;
				if (!map || !layerId) {
					return;
				}

				dispatchOnLayerVFSReady(
					store,
					map,
					layerId,
					fitMapViewToLayerSourceExtent(map, layerId, {maxZoom: 17}),
				);
			}
		},
		[editor, panelConfiguration],
	);

	return (
		<VectorEditorContext.Provider value={editor}>
			<Provider store={editor.store}>
				<Container as="main" panelConfiguration={panelConfiguration}>
					<MapsightMap
						id={mapId}
						store={editor.store}
						controller="map"
					>
						<MapOverlay>
							<MapOverlayBox.TopLeft />
							<MapOverlayBox.TopRight />
							<MapOverlayBox.BottomLeft />
							<MapOverlayBox.BottomRight />
						</MapOverlay>
					</MapsightMap>

					<Panels
						bar={
							<>
								<PanelConfigurationControls
									panelConfiguration={panelConfiguration}
									setPanelConfiguration={
										setPanelConfiguration
									}
								/>

								<Controls>
									<ModeControls editor={editor} />
									<ActionControls editor={editor} />
									<HistoryControls />
								</Controls>
							</>
						}
						side={
							<>
								<VisuallyHidden as={"strong"}>
									Ausschnitt
								</VisuallyHidden>
								<ViewInfo />

								{/*<div style={{padding: 10}}>
									<strong>Optionen</strong>
									<EditorOptions />

									<strong>Export/Import</strong>
									<p>TODO</p>
								</div>

								<div style={{padding: 10}}>
									<Button icon="icon-help" label="Hilfe" showLabel={true} />
								</div>*/}
							</>
						}
					>
						<strong>Elemente</strong>
						<FeatureList editor={editor} />

						<p style={{textAlign: "right"}}>
							<Button
								icon="icon-frame-features"
								label="Alle zentrieren"
								showLabel={true}
								onClick={fitMap}
							/>
						</p>
					</Panels>

					<Tooltip id="ms3-vector-editor-tooltip" delayShow={700} />
				</Container>
			</Provider>
		</VectorEditorContext.Provider>
	);
}

export default VectorEditor;
