import {compose} from "@reduxjs/toolkit";

import {async} from "@mapsight/core/lib/base/actions";
import type {LoadOptions} from "@mapsight/core/lib/feature-sources/actions";
import {
	LOAD_FEATURE_SOURCE_ERROR,
	LOAD_FEATURE_SOURCE_SUCCESS,
	load,
} from "@mapsight/core/lib/feature-sources/actions";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";

import get from "@mapsight/lib-js/object/getPath";

import {
	FEATURE_LIST,
	FEATURE_SOURCES,
} from "../../config/constants/controllers";
import createActionWatcher from "../../helpers/create-action-watcher";
import type {MapsightUiContext, PluginInstance} from "../../types";

const defaultLoadOptions: LoadOptions = {};
const defaultListControllerName = FEATURE_LIST;

/**
 * This plugin will delay the render until the feature source for the list is loaded
 *
 * @param [options] options
 * @param [options.loadOptions] options passed to the load function (depending on source type)
 * @param [options.listControllerName="list"] list controller name
 * @returns plugin instance
 */
export default function createPlugin(
	options: {
		loadOptions?: LoadOptions;
		listControllerName?: string;
	} = {},
): PluginInstance {
	const {
		loadOptions = defaultLoadOptions,
		listControllerName = defaultListControllerName,
	} = options;

	const actionWatcher = createActionWatcher();

	return {
		afterInit: function renderAwaitListFeatureSourcesLoadedInitPlugin(
			context,
		) {
			// @ts-expect-error TODO
			context.storeEnhancer = context.storeEnhancer
				? compose(context.storeEnhancer, actionWatcher.enhancer)
				: actionWatcher.enhancer;
		},

		beforeRender: function renderAwaitListFeatureSourcesLoadedRenderPlugin(
			context,
		) {
			if (!context.canPluginsDelayRender) {
				return Promise.resolve(undefined);
			}

			const listFeatureSourceId = getListFeatureSourceId(
				context,
				listControllerName,
			);
			if (!listFeatureSourceId) {
				return Promise.resolve(undefined);
			}

			const memberIds = getCombinedMemberIds(
				context,
				listFeatureSourceId,
			);

			// Combined sources only aggregate already-loaded members. Load
			// members first, then force-refresh the combined id so its loader
			// (and list markup) see real features before SSR emit.
			const initialIds =
				memberIds.length > 0 ? memberIds : [listFeatureSourceId];

			return waitForFeatureSourceLoads(
				context,
				actionWatcher,
				initialIds,
				loadOptions,
			).then(() => {
				if (memberIds.length === 0) {
					return;
				}
				return waitForFeatureSourceLoads(
					context,
					actionWatcher,
					[listFeatureSourceId],
					{...loadOptions, forceRefresh: true},
				);
			});
		},
	};
}

function waitForFeatureSourceLoads(
	context: MapsightUiContext,
	actionWatcher: ReturnType<typeof createActionWatcher>,
	featureSourceIds: string[],
	loadOptions: LoadOptions,
): Promise<void> {
	if (!featureSourceIds.length) {
		return Promise.resolve();
	}

	return new Promise<void>(function (resolve) {
		let remaining = [...featureSourceIds];

		actionWatcher.handler = (action) => {
			if (
				action.type === LOAD_FEATURE_SOURCE_SUCCESS ||
				action.type === LOAD_FEATURE_SOURCE_ERROR
			) {
				if (remaining.indexOf(action.id) > -1) {
					remaining = remaining.filter((f) => f !== action.id);
				}

				if (!remaining.length) {
					actionWatcher.handler = null;
					resolve();
				}
			}
		};

		featureSourceIds.forEach((featureSourceId) =>
			context.store?.dispatch(
				async(load(FEATURE_SOURCES, featureSourceId, loadOptions)),
			),
		);
	});
}

function getListFeatureSourceId(
	context: MapsightUiContext,
	listControllerName: string,
): string | undefined {
	const listFeatureSourceId = get(context.baseMapsightConfig, [
		listControllerName,
		"featureSource",
	]) as string | undefined;

	return typeof listFeatureSourceId === "string"
		? listFeatureSourceId
		: undefined;
}

/**
 * Member ids when `list.featureSource` is `combined`. Member names often live
 * on the store after plugins like combined-visible-layers run in afterCreate.
 */
function getCombinedMemberIds(
	context: MapsightUiContext,
	listFeatureSourceId: string,
): string[] {
	const sources =
		(context.store?.getState()?.[FEATURE_SOURCES] as
			FeatureSourcesState | undefined) ??
		(get(context.baseMapsightConfig, ["featureSources"]) as
			FeatureSourcesState | undefined);

	const listSource = sources?.[listFeatureSourceId];
	if (
		listSource?.type !== "combined" ||
		!Array.isArray(listSource.featureSourceNames)
	) {
		return [];
	}

	return listSource.featureSourceNames.filter(
		(memberId): memberId is string =>
			typeof memberId === "string" && memberId !== "",
	);
}
