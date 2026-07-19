import {execFileSync} from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";

const baseSha = process.env.BASE_SHA;
const prNumber = process.env.PR_NUMBER;
const repository = process.env.GITHUB_REPOSITORY ?? "open-mapsight/mapsight";

if (!baseSha || !prNumber) {
	console.error("BASE_SHA and PR_NUMBER are required.");
	process.exit(1);
}

const repoRoot = process.cwd();
const changesetDir = path.join(repoRoot, ".changeset");

const DEPENDENCY_FIELDS = [
	"dependencies",
	"devDependencies",
	"peerDependencies",
	"optionalDependencies",
] as const;

type PackageJson = {
	name?: unknown;
} & Partial<Record<(typeof DEPENDENCY_FIELDS)[number], Record<string, string>>>;

type DependencyBump = {
	name: string;
	from: string;
	to: string;
	kind: "major" | "minor" | "patch" | "unknown";
};

function gitDiffNameOnly(...extraArgs: string[]): string[] {
	const output = execFileSync(
		"git",
		["diff", "--name-only", `${baseSha}...HEAD`, ...extraArgs],
		{encoding: "utf8"},
	);
	return output
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
}

function gitShowJson(sha: string, filePath: string): PackageJson | null {
	try {
		const output = execFileSync("git", ["show", `${sha}:${filePath}`], {
			encoding: "utf8",
		});
		return JSON.parse(output) as PackageJson;
	} catch {
		return null;
	}
}

function readPackageName(packageJsonPath: string): string | null {
	const absolutePath = path.join(repoRoot, packageJsonPath);
	const packageJson = JSON.parse(readFileSync(absolutePath, "utf8")) as {
		name?: unknown;
	};
	return typeof packageJson.name === "string" ? packageJson.name : null;
}

function collectDependencyRanges(
	packageJson: PackageJson | null,
): Map<string, string> {
	const ranges = new Map<string, string>();
	if (!packageJson) {
		return ranges;
	}

	for (const field of DEPENDENCY_FIELDS) {
		const deps = packageJson[field];
		if (!deps || typeof deps !== "object") {
			continue;
		}
		for (const [name, range] of Object.entries(deps)) {
			if (typeof range === "string") {
				ranges.set(name, range);
			}
		}
	}

	return ranges;
}

/** Strip a leading ^/~ and read leading major.minor.patch. */
function parseCoreVersion(range: string): [number, number, number] | null {
	const match = range
		.trim()
		.replace(/^[\^~]/, "")
		.match(/^(\d+)\.(\d+)\.(\d+)/);
	if (!match) {
		return null;
	}
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function bumpKind(from: string, to: string): DependencyBump["kind"] {
	const a = parseCoreVersion(from);
	const b = parseCoreVersion(to);
	if (!a || !b) {
		return "unknown";
	}
	if (a[0] !== b[0]) {
		return "major";
	}
	if (a[1] !== b[1]) {
		return "minor";
	}
	if (a[2] !== b[2]) {
		return "patch";
	}
	return "unknown";
}

function dependencyBumpsForPackage(packageJsonPath: string): DependencyBump[] {
	const before = collectDependencyRanges(
		gitShowJson(baseSha, packageJsonPath),
	);
	const after = collectDependencyRanges(gitShowJson("HEAD", packageJsonPath));
	const names = new Set([...before.keys(), ...after.keys()]);
	const bumps: DependencyBump[] = [];

	for (const name of [...names].sort()) {
		const from = before.get(name);
		const to = after.get(name);
		if (from === to) {
			continue;
		}
		if (from === undefined || to === undefined) {
			// Added/removed deps: still useful, but kind is unknown.
			bumps.push({
				name,
				from: from ?? "(none)",
				to: to ?? "(removed)",
				kind: "unknown",
			});
			continue;
		}
		bumps.push({name, from, to, kind: bumpKind(from, to)});
	}

	return bumps;
}

function packageSlug(packageName: string): string {
	return packageName.replace(/^@/, "").replace(/\//g, "-");
}

function changesetPathFor(packageName: string): string {
	return path.join(
		changesetDir,
		`dependabot-${prNumber}-${packageSlug(packageName)}.md`,
	);
}

function buildSummary(
	pullRequestNumber: string,
	repo: string,
	bumps: DependencyBump[],
): string {
	const url = `https://github.com/${repo}/pull/${pullRequestNumber}`;
	const header = `Bump dependencies from Dependabot ([#${pullRequestNumber}](${url})):`;
	const lines = bumps.map(
		(bump) =>
			`- \`${bump.name}\` \`${bump.from}\` → \`${bump.to}\` (${bump.kind})`,
	);
	return [header, ...lines].join("\n");
}

function removeStaleDependabotChangesets(keepPaths: Set<string>): void {
	if (!existsSync(changesetDir)) {
		return;
	}

	const prefix = `dependabot-${prNumber}`;
	for (const entry of readdirSync(changesetDir)) {
		if (entry !== `${prefix}.md` && !entry.startsWith(`${prefix}-`)) {
			continue;
		}
		const absolutePath = path.join(changesetDir, entry);
		if (keepPaths.has(absolutePath)) {
			continue;
		}
		unlinkSync(absolutePath);
		console.log(`Removed stale changeset: .changeset/${entry}`);
	}
}

const changedPackageJsonPaths = gitDiffNameOnly("--", "**/package.json").filter(
	(file) => file !== "package.json",
);

mkdirSync(changesetDir, {recursive: true});

const writtenPaths = new Set<string>();
let wroteCount = 0;

for (const packageJsonPath of changedPackageJsonPaths) {
	const bumps = dependencyBumpsForPackage(packageJsonPath);
	if (bumps.length === 0) {
		continue;
	}

	const packageName = readPackageName(packageJsonPath);
	if (!packageName) {
		continue;
	}

	const targetPath = changesetPathFor(packageName);
	const contents = `---
"${packageName}": patch
---

${buildSummary(prNumber, repository, bumps)}
`;

	writtenPaths.add(targetPath);

	if (
		existsSync(targetPath) &&
		readFileSync(targetPath, "utf8") === contents
	) {
		console.log(
			`Changeset already up to date: ${path.relative(repoRoot, targetPath)}`,
		);
		continue;
	}

	writeFileSync(targetPath, contents);
	wroteCount += 1;
	console.log(
		`Wrote ${path.relative(repoRoot, targetPath)} (${bumps.length} dependency change(s)).`,
	);
}

removeStaleDependabotChangesets(writtenPaths);

if (writtenPaths.size === 0) {
	console.log(
		"No versionable dependency changes detected; skipping changeset.",
	);
	process.exit(0);
}

if (wroteCount === 0) {
	console.log("All Dependabot changesets already up to date.");
}
