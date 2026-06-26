import path from "node:path";

import type {Configuration} from "lint-staged";

type PackageInfo = {
	filter: string;
	relativePath: string;
};

const toRepoRelativePath = (filePath: string): string => {
	const parts = path.normalize(filePath).split(path.sep).filter(Boolean);

	const privateIdx = parts.indexOf("private");
	if (
		privateIdx !== -1 &&
		(parts[privateIdx + 1] === "apps" ||
			parts[privateIdx + 1] === "packages")
	) {
		return parts.slice(privateIdx).join(path.sep);
	}

	const packagesIdx = parts.indexOf("packages");
	if (packagesIdx !== -1) {
		return parts.slice(packagesIdx).join(path.sep);
	}

	const appsIdx = parts.indexOf("apps");
	if (appsIdx !== -1) {
		return parts.slice(appsIdx).join(path.sep);
	}

	return filePath;
};

const getPackageInfo = (filePath: string): PackageInfo | null => {
	const parts = toRepoRelativePath(filePath).split(path.sep);

	if (
		parts[0] === "private" &&
		(parts[1] === "apps" || parts[1] === "packages") &&
		parts[2]
	) {
		const relativePath = parts.slice(3).join(path.sep);
		if (!relativePath) {
			return null;
		}

		return {filter: parts[2], relativePath};
	}

	if ((parts[0] === "packages" || parts[0] === "apps") && parts[1]) {
		const relativePath = parts.slice(2).join(path.sep);
		if (!relativePath) {
			return null;
		}

		return {filter: parts[1], relativePath};
	}

	return null;
};

const runInPackage =
	(scriptName: string, {passFiles = true}: {passFiles?: boolean} = {}) =>
	(filenames: readonly string[]) => {
		const packages = new Map<string, string[]>();

		filenames.forEach((filename) => {
			const pkg = getPackageInfo(filename);
			if (!pkg) {
				return;
			}

			if (!packages.has(pkg.filter)) {
				packages.set(pkg.filter, []);
			}

			packages.get(pkg.filter)!.push(pkg.relativePath);
		});

		return Array.from(packages.entries()).map(([filter, files]) => {
			const fileArgs = passFiles ? ` -- ${files.join(" ")}` : "";
			return `pnpm --filter ${filter} run ${scriptName}${fileArgs}`;
		});
	};

export default {
	"*.{js,mjs,cjs,ts,mts,cts,tsx}": [
		"pnpx prettier --write",
		runInPackage("lint --fix"),
		// ESLint --fix can reformat outside Prettier; align with CI format:check.
		"pnpx prettier --write",
		runInPackage("typecheck", {passFiles: false}),
	],
	"*.{json,md}": "pnpx prettier --write",
	"**/package.json": () => "pnpm run syncpack:fix-and-format",
} as const satisfies Configuration;
