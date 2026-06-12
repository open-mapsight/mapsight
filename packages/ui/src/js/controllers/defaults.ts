import type {BaseController} from "@mapsight/core/lib/base/controller";
import {FeatureSelectionsController} from "@mapsight/core/lib/feature-selections/controller";
import {FeatureSourcesController} from "@mapsight/core/lib/feature-sources/controller";
import {FilterController} from "@mapsight/core/lib/filter/controller";
import {ListController} from "@mapsight/core/lib/list/controller";
import {MapController} from "@mapsight/core/lib/map/controller";
import {ProjectionsController} from "@mapsight/core/lib/projections/controller";
import {UserGeolocationController} from "@mapsight/core/lib/user-geolocation/controller";

import {siteConfig} from "../config";
import * as c from "../config/constants/controllers";
import type {mapsightConfigSchemas} from "../config/schema";
import {createTagFilterFunction} from "../filters/tag-filter";
import timeFilter from "../filters/time-filter";
import type {MapsightUiContext} from "../types";

export function createDefaultControllers(
	context: MapsightUiContext,
): Record<string, BaseController> {
	const mapController = new MapController(c.MAP);
	mapController.setStyleFunction(context.styleFunction);

	const imagesUrl = context.createOptions.imagesUrl || siteConfig.imagesUrl;
	if (imagesUrl) {
		mapController.setDefaultStyleEnv({imagesUrl});
	}

	return {
		[c.PROJECTIONS]: new ProjectionsController(c.PROJECTIONS),
		[c.MAP]: mapController,
		[c.FEATURE_LIST]: new ListController(c.FEATURE_LIST),
		[c.TIME_FILTER]: new FilterController(c.TIME_FILTER, timeFilter),
		[c.TAG_FILTER]: new FilterController(
			c.TAG_FILTER,
			createTagFilterFunction(),
		),
		[c.USER_GEOLOCATION]: new UserGeolocationController(c.USER_GEOLOCATION),
		[c.FEATURE_SOURCES]: new FeatureSourcesController(c.FEATURE_SOURCES),
		[c.FEATURE_SELECTIONS]: new FeatureSelectionsController(
			c.FEATURE_SELECTIONS,
		),
	} satisfies Record<keyof typeof mapsightConfigSchemas, BaseController>;
}
