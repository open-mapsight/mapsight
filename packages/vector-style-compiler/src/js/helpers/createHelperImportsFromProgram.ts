import uniq from "lodash/uniq.js";

const HELPER_IMPORTS: Record<string, string> = {
	mapsightRuntimeIconSize: `import { mapsightRuntimeIconSize } from '@mapsight/traffic-style/runtime';`,
	mapsightRuntimeIcon: `import { mapsightRuntimeIcon } from '@mapsight/traffic-style/runtime';`,
};

export default function createHelperImportsFromProgram(
	program: string,
): string {
	const helpers = uniq(
		Object.keys(HELPER_IMPORTS).filter((name) =>
			new RegExp(`\\b${name}\\s*\\(`).test(program),
		),
	);

	return helpers.map((name) => HELPER_IMPORTS[name]).join("\n");
}
