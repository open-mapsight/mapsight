import path from "node:path";

import type {Configuration} from "lint-staged";

const getPackageName = (filePath: string): string | null => {
	const parts = filePath.split(path.sep);
	const roots = ["packages", "apps"];

	return roots.includes(parts[0]!) ? parts[1]! : null;
};

const runInPackage = (scriptName: string) => (filenames: readonly string[]) => {
	const packages = new Map<string, string[]>();

	filenames.forEach((filename) => {
		const pkgName = getPackageName(filename);
		if (pkgName) {
			if (!packages.has(pkgName)) {
				packages.set(pkgName, []);
			}
			packages.get(pkgName)!.push(filename);
		}
	});

	return Array.from(packages.keys()).map((pkgName) => {
		const files = packages.get(pkgName)!.join(" ");
		return `pnpm --filter ${pkgName} run ${scriptName} -- ${files}`;
	});
};

export default {
	"*.{js,mjs,cjs,ts,mts,cts,tsx}": [
		"pnpx prettier --write",
		runInPackage("lint --fix"),
		runInPackage("typecheck"),
	],
	"*.{json,md}": "pnpx prettier --write",
	"**/package.json": () => "pnpm run syncpack:fix-and-format",
} as const satisfies Configuration;
