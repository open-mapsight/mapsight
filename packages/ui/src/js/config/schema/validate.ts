import {formatZodError, validateConfig} from "@mapsight/core/schema";

import {type MapsightConfig, mapsightConfigSchema} from "./index";

export {formatZodError};

export function validateMapsightConfig(
	config: unknown,
	options?: {strict?: boolean; context?: string},
): Partial<MapsightConfig> {
	return validateConfig(mapsightConfigSchema, config, options);
}
