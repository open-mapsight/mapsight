import path from "node:path";

import type {Configuration} from "lint-staged";

const getPackageName = (filePath: string): string | null => {
	const [root, group, name] = filePath.split(path.sep);

	if (
		root === "private" &&
		(group === "apps" || group === "packages") &&
		name
	) {
		return name;
	}

	if (root && name && (root === "packages" || root === "apps")) {
		return name;
	}

	return null;
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
