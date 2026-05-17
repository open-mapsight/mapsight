import type {Feature} from "geojson";

import {setData} from "@mapsight/core/lib/feature-sources/actions";
import {setLayerStyle} from "@mapsight/core/lib/map/actions";
import type EditorMixin from "@mapsight/core/mixins/EditorMixin";

import {observeState} from "@mapsight/lib-redux/observe-state";

import {
	getQueryStringParameter,
	readRemoteData,
	readRemoteDataGeoJson,
	writeRemoteData,
} from "./helpers/adapter-utils.ts";
import featureCollectionToGeometryCollection from "./helpers/featureCollectionToGeometryCollection.ts";

const SELECTOR_DETOUR_GEOJSON = '[name*="data["][name*="][detour_geojson]"]';
const SELECTOR_GEOJSON = '[name*="data["][name*="][geojson]"]';
const SELECTOR_TYPE =
	'[name*="data["][name*="][tmc_event_code]"] option:checked';
const SELECTOR_TYPE_OVERRIDE = '[name*="data["][name*="][type_override]"]';
const SELECTOR_TYPE_IS_TEMPORARY_OVERRIDE =
	'[name*="data["][name*="][is_temporary_restriction_override]"]';

const sourceType =
	getQueryStringParameter(window.location.href, "type") || "main";

const syncRemoteDocument = (window.opener as Window | undefined)?.document;

export function getInitialData() {
	return syncRemoteDocument
		? readRemoteDataGeoJson(
				syncRemoteDocument,
				sourceType === "detour"
					? SELECTOR_DETOUR_GEOJSON
					: SELECTOR_GEOJSON,
			)
		: undefined;
}

export function getMapsightIconId() {
	return sourceType === "detour" ? "umleitung" : "ort";
}

function calcFeatureProperties({
	type,
	typeOverride,
	isTemporaryRestriction,
	isTemporaryRestrictionOverride,
}: {
	type: string;
	typeOverride?: string;
	isTemporaryRestriction?: string;
	isTemporaryRestrictionOverride?: string;
}) {
	return {
		type: typeOverride && typeOverride !== "0" ? typeOverride : type,
		isTemporaryRestriction:
			isTemporaryRestrictionOverride === "1" ||
			(isTemporaryRestrictionOverride === "0" &&
				isTemporaryRestriction === "1"),
	};
}

function calcStyleParams({
	type,
	isTemporaryRestriction,
}: {
	type: string;
	isTemporaryRestriction?: boolean;
}) {
	return {
		style: "features",
		mapsightIconId:
			{
				constructionWork: "baustelle",
				situation: "meldung",
				event: "sport",
				closureOneway: "einbahnstrasse",
				closure: "vollsperrung",
				truckClosure: "lkwsperrung",
				narrowing: "fahrbahnverengung",
				contraflow: "gegenverkehr",
				trafficJam: "stau",
				widthLimit: "breitenbeschraenkung",
				heightLimit: "hoehenbeschraenkung",
				weightLimit: "tonnage",
				detour: "umleitung",
			}[type] || "meldung",
		isTemporaryRestriction: isTemporaryRestriction,
	};
}

let cacheStyle: string | null = null;

function syncFromRemote(editor: EditorMixin) {
	const store = editor.store;

	// update style
	const styleParams = calcStyleParams(
		calcFeatureProperties({
			// base fields
			type:
				readRemoteData(
					syncRemoteDocument,
					SELECTOR_TYPE,
					"data-type",
				) || "default",
			isTemporaryRestriction:
				readRemoteData(
					syncRemoteDocument,
					SELECTOR_TYPE,
					"data-is-temporary-restriction",
				) || undefined,

			// overrides
			typeOverride:
				readRemoteData(syncRemoteDocument, SELECTOR_TYPE_OVERRIDE) ||
				undefined,
			isTemporaryRestrictionOverride:
				readRemoteData(
					syncRemoteDocument,
					SELECTOR_TYPE_IS_TEMPORARY_OVERRIDE,
				) || undefined,
		}),
	);
	const newStyleParamsHash = JSON.stringify(styleParams);
	const styleChanged = cacheStyle !== newStyleParamsHash;

	if (styleChanged) {
		cacheStyle = newStyleParamsHash;
	}

	if (sourceType === "detour") {
		// context data layer
		if (syncRemoteDocument) {
			const contextData = readRemoteDataGeoJson(
				syncRemoteDocument,
				SELECTOR_GEOJSON,
			);
			store.dispatch(setData("featureSources", "context", contextData));
		}

		if (styleChanged) {
			store.dispatch(setLayerStyle("map", "context", styleParams));
		}
	}

	if (sourceType === "main" && styleChanged) {
		store.dispatch(editor.actions.setDisplayStyle!(styleParams));
	}

	// TODO: Check if we need to apply main styles to context layer
}

export function setup(editor: EditorMixin) {
	if (syncRemoteDocument) {
		const selectorData =
			sourceType === "detour"
				? SELECTOR_DETOUR_GEOJSON
				: SELECTOR_GEOJSON;
		observeState(editor.store, editor.selectors.features!, (features) => {
			const geometryCollection = featureCollectionToGeometryCollection({
				type: "FeatureCollection",
				features: features as Feature[],
			});

			writeRemoteData(
				syncRemoteDocument,
				selectorData,
				JSON.stringify({
					type: "FeatureCollection",
					features: [
						{
							type: "Feature",
							geometry:
								geometryCollection.geometries.length === 1
									? geometryCollection.geometries[0]
									: geometryCollection,
						},
					],
				}),
			);
		});

		syncFromRemote(editor);
		setInterval(() => syncFromRemote(editor), 1000);

		window.focus();
	}
}
