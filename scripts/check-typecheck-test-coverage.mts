import {existsSync, readFileSync, readdirSync, statSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKSPACE_DIRS = ["packages", "apps"] as const;

const TEST_FILE_PATTERN = /\.(test|spec)\.(ts|tsx)$/;

/** Packages not yet on the unified tsconfig pattern (see docs/development/STANDARDS.md). */
const ALLOWLIST = new Set([
	"@mapsight/count-aggregator-api",
	"@mapsight/lib-ol",
	"@mapsight/traffic-style",
	"@mapsight/ui",
]);

type WorkspacePackage = {
	dir: string;
	name: string;
};

function findWorkspacePackages(): Array<WorkspacePackage> {
	const packages: Array<WorkspacePackage> = [];

	for (const workspaceDir of WORKSPACE_DIRS) {
		const workspaceRoot = path.join(ROOT, workspaceDir);
		if (!existsSync(workspaceRoot)) {
			continue;
		}

		for (const entry of readdirSync(workspaceRoot)) {
			const dir = path.join(workspaceRoot, entry);
			const packageJsonPath = path.join(dir, "package.json");
			if (!statSync(dir).isDirectory() || !existsSync(packageJsonPath)) {
				continue;
			}

			const {name} = JSON.parse(
				readFileSync(packageJsonPath, "utf8"),
			) as {name: string};
			packages.push({dir, name});
		}
	}

	return packages;
}

function hasTestSources(dir: string): boolean {
	const queue = [dir];

	while (queue.length > 0) {
		const current = queue.pop();
		if (!current) {
			continue;
		}

		for (const entry of readdirSync(current, {withFileTypes: true})) {
			if (entry.name === "node_modules" || entry.name === "dist") {
				continue;
			}

			const entryPath = path.join(current, entry.name);
			if (entry.isDirectory()) {
				queue.push(entryPath);
				continue;
			}

			if (TEST_FILE_PATTERN.test(entry.name)) {
				return true;
			}
		}
	}

	return false;
}

function excludesTestsFromTypecheck(tsconfigPath: string): boolean {
	const content = readFileSync(tsconfigPath, "utf8");
	if (!content.includes('"exclude"')) {
		return false;
	}

	return (
		content.includes(".test.ts") ||
		content.includes(".test.tsx") ||
		content.includes(".spec.ts") ||
		content.includes(".spec.tsx") ||
		content.includes("__tests__")
	);
}

function findViolations(pkg: WorkspacePackage): Array<string> {
	const violations: Array<string> = [];

	if (existsSync(path.join(pkg.dir, "tsconfig.test.json"))) {
		violations.push(
			`${pkg.name}: tsconfig.test.json is not supported. ` +
				"Typecheck tests via tsconfig.json (noEmit, all sources) and emit via tsconfig.build.json.",
		);
	}

	const tsconfigPath = path.join(pkg.dir, "tsconfig.json");
	if (existsSync(tsconfigPath) && excludesTestsFromTypecheck(tsconfigPath)) {
		violations.push(
			`${pkg.name}: tsconfig.json excludes test files but the package contains *.test.* / *.spec.* sources. ` +
				"Use tsconfig.json (noEmit, all sources) for typecheck/IDE and tsconfig.build.json (emit, no tests) for build.",
		);
	}

	return violations;
}

function main() {
	const failures: Array<string> = [];
	const seen = new Set<string>();

	for (const pkg of findWorkspacePackages()) {
		seen.add(pkg.name);

		if (!hasTestSources(pkg.dir)) {
			continue;
		}

		const violations = findViolations(pkg);
		if (!ALLOWLIST.has(pkg.name)) {
			failures.push(...violations);
		} else if (violations.length === 0) {
			failures.push(
				`${pkg.name}: already follows the tsconfig pattern. Remove it from ALLOWLIST in scripts/check-typecheck-test-coverage.mts.`,
			);
		}
	}

	for (const name of ALLOWLIST) {
		if (!seen.has(name)) {
			failures.push(
				`${name}: listed in ALLOWLIST but no such workspace package exists. Remove it from the allowlist.`,
			);
		}
	}

	if (failures.length > 0) {
		console.error("Typecheck test coverage check failed:\n");
		for (const failure of failures) {
			console.error(`- ${failure}`);
		}
		process.exit(1);
	}

	console.log("Typecheck test coverage check passed.");
}

main();
