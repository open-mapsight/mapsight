import {existsSync, readFileSync, readdirSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STARTERS_DIR = path.join(ROOT, "starters");

const FORBIDDEN = /^(catalog:|workspace:)/;

type PackageJson = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

function collectViolations(starterDir: string, pkg: PackageJson): string[] {
	const violations: string[] = [];

	for (const section of ["dependencies", "devDependencies"] as const) {
		const deps = pkg[section];
		if (!deps) {
			continue;
		}

		for (const [name, specifier] of Object.entries(deps)) {
			if (FORBIDDEN.test(specifier)) {
				violations.push(
					`${starterDir}: ${section}.${name} = "${specifier}"`,
				);
			}
		}
	}

	return violations;
}

function main(): void {
	if (!existsSync(STARTERS_DIR)) {
		return;
	}

	const violations: string[] = [];

	for (const entry of readdirSync(STARTERS_DIR)) {
		const starterRoot = path.join(STARTERS_DIR, entry);
		const packageJsonPath = path.join(starterRoot, "package.json");
		if (!existsSync(packageJsonPath)) {
			continue;
		}

		const pkg = JSON.parse(
			readFileSync(packageJsonPath, "utf8"),
		) as PackageJson;
		violations.push(...collectViolations(`starters/${entry}`, pkg));
	}

	if (violations.length > 0) {
		console.error(
			"Starter package.json files must use npm semver pins only (no catalog: or workspace:).\n",
		);
		for (const violation of violations) {
			console.error(`  - ${violation}`);
		}
		console.error("\nRun: pnpm run sync:starter-pins\n");
		throw new Error("Starter package pin check failed.");
	}

	console.log("Starter package pin check passed.");
}

main();
