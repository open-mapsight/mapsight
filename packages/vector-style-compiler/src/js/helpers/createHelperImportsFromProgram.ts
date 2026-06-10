import uniq from "lodash/uniq.js";

const HELPER_IMPORTS: Record<string, string> = {
	mapsightRuntimeIcon: `import { mapsightRuntimeIcon } from '@mapsight/traffic-style/runtime';`,
};

export default function createHelperImportsFromProgram(
	program: string,
): string {
	const helpers = uniq(
		Object.keys(HELPER_IMPORTS).filter((name) => program.includes(name)),
	);

	return helpers.map((name) => HELPER_IMPORTS[name]).join("\n");
}
