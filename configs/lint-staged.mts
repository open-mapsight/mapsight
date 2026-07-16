import {existsSync, readFileSync} from "node:fs";
import path from "node:path";

import type {Configuration} from "lint-staged";

type PackageInfo = {
	filter: string;
	relativePath: string;
	workspaceDir: "packages" | "apps" | "private/packages" | "private/apps";
};

export const PRETTIER_WRITE = "pnpx prettier --write";

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

export const getPackageInfo = (filePath: string): PackageInfo | null => {
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

		return {
			filter: parts[2],
			relativePath,
			workspaceDir: `${parts[0]}/${parts[1]}` as
				"private/packages" | "private/apps",
		};
	}

	if ((parts[0] === "packages" || parts[0] === "apps") && parts[1]) {
		const relativePath = parts.slice(2).join(path.sep);
		if (!relativePath) {
			return null;
		}

		return {
			filter: parts[1],
			relativePath,
			workspaceDir: parts[0],
		};
	}

	return null;
};

const packageHasScript = (
	workspaceDir: PackageInfo["workspaceDir"],
	filter: string,
	scriptName: string,
): boolean => {
	const baseScript = scriptName.split(/\s+/)[0];
	if (!baseScript) {
		return false;
	}

	const packageJsonPath = path.join(workspaceDir, filter, "package.json");
	if (!existsSync(packageJsonPath)) {
		return false;
	}

	try {
		const packageJson = JSON.parse(
			readFileSync(packageJsonPath, "utf8"),
		) as {scripts?: Record<string, string>};
		return Boolean(packageJson.scripts?.[baseScript]);
	} catch {
		return false;
	}
};

export const runInPackage =
	(scriptName: string, {passFiles = true}: {passFiles?: boolean} = {}) =>
	(filenames: readonly string[]) => {
		const packages = new Map<
			string,
			{
				filter: string;
				workspaceDir: PackageInfo["workspaceDir"];
				files: string[];
			}
		>();

		filenames.forEach((filename) => {
			const pkg = getPackageInfo(filename);
			if (!pkg) {
				return;
			}

			const key = `${pkg.workspaceDir}/${pkg.filter}`;
			let entry = packages.get(key);
			if (!entry) {
				entry = {
					filter: pkg.filter,
					workspaceDir: pkg.workspaceDir,
					files: [],
				};
				packages.set(key, entry);
			}

			entry.files.push(pkg.relativePath);
		});

		return Array.from(packages.values())
			.filter((pkg) =>
				packageHasScript(pkg.workspaceDir, pkg.filter, scriptName),
			)
			.map((pkg) => {
				const fileArgs = passFiles ? ` -- ${pkg.files.join(" ")}` : "";
				return `pnpm --filter ${pkg.filter} run ${scriptName}${fileArgs}`;
			});
	};

export default {
	"*.{js,mjs,cjs,ts,mts,cts,tsx}": [
		PRETTIER_WRITE,
		runInPackage("lint --fix"),
		// ESLint --fix can reformat outside Prettier; align with CI format:check.
		PRETTIER_WRITE,
		runInPackage("typecheck", {passFiles: false}),
	],
	"*.{json,md}": PRETTIER_WRITE,
	"**/package.json": () => "pnpm run syncpack:fix-and-format",
} as const satisfies Configuration;
