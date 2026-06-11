import type {z} from "zod";

import {featureSelectionsConfigSchema} from "@mapsight/core/lib/feature-selections/schema";
import {featureSourcesConfigSchema} from "@mapsight/core/lib/feature-sources/schema";
import {listConfigSchema} from "@mapsight/core/lib/list/schema";
import {mapConfigSchema} from "@mapsight/core/lib/map/schema";
import {projectionsConfigSchema} from "@mapsight/core/lib/projections/schema";
import {userGeolocationConfigSchema} from "@mapsight/core/lib/user-geolocation/schema";
import {createMapsightConfigSchema} from "@mapsight/core/schema";

import {tagFilterConfigSchema} from "../../filters/tag-filter";
import {timeFilterConfigSchema} from "../../filters/time-filter";
import * as c from "../constants/controllers";

export type MapsightConfig = z.infer<typeof mapsightConfigSchema>;

/**
 * Per-slice config schemas for the default @mapsight/ui controller set.
 * Slice keys match controller names registered at store creation time.
 */
export const mapsightConfigSchemas = {
	[c.MAP]: mapConfigSchema,
	[c.FEATURE_LIST]: listConfigSchema,
	[c.FEATURE_SOURCES]: featureSourcesConfigSchema,
	[c.FEATURE_SELECTIONS]: featureSelectionsConfigSchema,
	[c.PROJECTIONS]: projectionsConfigSchema,
	[c.TAG_FILTER]: tagFilterConfigSchema,
	[c.TIME_FILTER]: timeFilterConfigSchema,
	[c.USER_GEOLOCATION]: userGeolocationConfigSchema,
} satisfies Record<string, z.ZodType>;

export const mapsightConfigSchema = createMapsightConfigSchema(
	mapsightConfigSchemas,
);
