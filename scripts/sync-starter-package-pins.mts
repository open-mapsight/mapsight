import {existsSync, readFileSync, readdirSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STARTERS_DIR = path.join(ROOT, "starters");
const PACKAGES_DIR = path.join(ROOT, "packages");
const WORKSPACE_FILE = path.join(ROOT, "pnpm-workspace.yaml");

type PackageJson = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	[key: string]: unknown;
};

function stripYamlQuotes(value: string): string {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1);
	}

	return trimmed;
}

function parseCatalog(workspaceYaml: string): Record<string, string> {
	const catalog: Record<string, string> = {};
	let inCatalog = false;

	for (const line of workspaceYaml.split("\n")) {
		if (/^catalog:\s*$/.test(line)) {
			inCatalog = true;
			continue;
		}

		if (!inCatalog) {
			continue;
		}

		if (/^\S/.test(line)) {
			break;
		}

		const match = line.match(/^\s+"?([^":]+)"?:\s*(.+?)\s*$/);
		if (match) {
			catalog[stripYamlQuotes(match[1]!)] = stripYamlQuotes(match[2]!);
		}
	}

	return catalog;
}

function loadWorkspacePackageVersions(): Map<string, string> {
	const versions = new Map<string, string>();

	if (!existsSync(PACKAGES_DIR)) {
		return versions;
	}

	for (const entry of readdirSync(PACKAGES_DIR)) {
		const packageJsonPath = path.join(PACKAGES_DIR, entry, "package.json");
		if (!existsSync(packageJsonPath)) {
			continue;
		}

		const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
			name?: string;
			version?: string;
		};

		if (pkg.name && pkg.version) {
			versions.set(pkg.name, pkg.version);
		}
	}

	return versions;
}

const RANGE_PREFIX = /^[~^><=]|^\d+\.\*|^\*/;
const BARE_SEMVER = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;

function toCaretPin(specifier: string): string {
	if (RANGE_PREFIX.test(specifier) || !BARE_SEMVER.test(specifier)) {
		return specifier;
	}

	return `^${specifier}`;
}

function resolveSpecifier(
	depName: string,
	specifier: string,
	catalog: Record<string, string>,
	workspaceVersions: Map<string, string>,
): string {
	specifier = stripYamlQuotes(specifier);

	if (specifier === "catalog:" || specifier.startsWith("catalog:")) {
		const catalogKey =
			specifier === "catalog:"
				? depName
				: specifier.slice("catalog:".length);
		const resolved = catalog[catalogKey];

		if (!resolved) {
			throw new Error(
				`No pnpm catalog entry for "${catalogKey}" (${depName})`,
			);
		}

		return toCaretPin(resolved);
	}

	if (specifier.startsWith("workspace:")) {
		const resolved = workspaceVersions.get(depName);

		if (!resolved) {
			throw new Error(
				`No workspace package version for "${depName}" (${specifier})`,
			);
		}

		return toCaretPin(resolved);
	}

	if (depName.startsWith("@mapsight/")) {
		const workspaceVersion = workspaceVersions.get(depName);
		if (workspaceVersion) {
			return toCaretPin(workspaceVersion);
		}
	}

	return toCaretPin(specifier);
}

function syncDependencySection(
	section: Record<string, string> | undefined,
	catalog: Record<string, string>,
	workspaceVersions: Map<string, string>,
): Record<string, string> | undefined {
	if (!section) {
		return section;
	}

	const next: Record<string, string> = {};

	for (const [depName, specifier] of Object.entries(section)) {
		next[depName] = resolveSpecifier(
			depName,
			specifier,
			catalog,
			workspaceVersions,
		);
	}

	return next;
}

function syncStarterPackageJson(starterPath: string): boolean {
	const packageJsonPath = path.join(starterPath, "package.json");
	const original = readFileSync(packageJsonPath, "utf8");
	const pkg = JSON.parse(original) as PackageJson;
	const catalog = parseCatalog(readFileSync(WORKSPACE_FILE, "utf8"));
	const workspaceVersions = loadWorkspacePackageVersions();

	const next: PackageJson = {
		...pkg,
		dependencies: syncDependencySection(
			pkg.dependencies,
			catalog,
			workspaceVersions,
		),
		devDependencies: syncDependencySection(
			pkg.devDependencies,
			catalog,
			workspaceVersions,
		),
	};

	const formatted = `${JSON.stringify(next, null, "\t")}\n`;
	if (formatted === original) {
		return false;
	}

	writeFileSync(packageJsonPath, formatted, "utf8");
	return true;
}

function main(): void {
	if (!existsSync(STARTERS_DIR)) {
		return;
	}

	const updated: string[] = [];

	for (const entry of readdirSync(STARTERS_DIR)) {
		const starterPath = path.join(STARTERS_DIR, entry);
		if (!existsSync(path.join(starterPath, "package.json"))) {
			continue;
		}

		if (syncStarterPackageJson(starterPath)) {
			updated.push(`starters/${entry}/package.json`);
		}
	}

	if (updated.length === 0) {
		console.log("Starter package pins are already up to date.");
	} else {
		console.log("Updated starter package pins:");
		for (const file of updated) {
			console.log(`  - ${file}`);
		}
	}
}

main();
