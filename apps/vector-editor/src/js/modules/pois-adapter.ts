import type {Feature} from "geojson";

import type EditorMixin from "@mapsight/core/mixins/EditorMixin";

import {observeState} from "@mapsight/lib-redux/observe-state";

import {
	readRemoteData,
	readRemoteDataGeoJson,
	writeRemoteData,
} from "./helpers/adapter-utils.ts";
import featureCollectionToGeometryCollection from "./helpers/featureCollectionToGeometryCollection.ts";

const SELECTOR_GEOJSON = '[name*="data["][name*="][geojson]"]';
const SELECTOR_TYPE = '[name*="data["][name*="][type]"] option:checked';

const syncRemoteDocument = (window.opener as Window | undefined)?.document;

export function getInitialData() {
	return syncRemoteDocument
		? readRemoteDataGeoJson(syncRemoteDocument, SELECTOR_GEOJSON)
		: undefined;
}

export function getMapsightIconId() {
	return "ort";
}

function calcStyleParams({type}: {type: string}) {
	return {
		style: "features",
		mapsightIconId:
			{
				cam: "webcam",
			}[type] || "ort",
		isTemporaryRestriction: false,
	};
}

let cacheStyle: string | null = null;

function syncFromRemote(editor: EditorMixin) {
	const store = editor.store;

	// update style
	const styleParams = calcStyleParams({
		type: readRemoteData(syncRemoteDocument, SELECTOR_TYPE) || "default",
	});
	const newStyleParamsHash = JSON.stringify(styleParams);
	const styleChanged = cacheStyle !== newStyleParamsHash;

	if (styleChanged) {
		cacheStyle = newStyleParamsHash;
	}

	store.dispatch(editor.actions.setDisplayStyle!(styleParams));
}

export function setup(editor: EditorMixin) {
	if (syncRemoteDocument) {
		observeState(
			editor.store,
			editor.selectors.features as (s: unknown) => Feature[],
			(features: Feature[]) => {
				const geometryCollection =
					featureCollectionToGeometryCollection({
						type: "FeatureCollection",
						features: features,
					});

				writeRemoteData(
					syncRemoteDocument,
					SELECTOR_GEOJSON,
					JSON.stringify(
						geometryCollection.geometries.length === 1
							? geometryCollection.geometries[0]
							: geometryCollection,
					),
				);
			},
		);

		syncFromRemote(editor);
		setInterval(() => syncFromRemote(editor), 1000);

		window.focus();
	}
}
