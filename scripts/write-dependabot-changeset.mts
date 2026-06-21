import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import path from "node:path";

const baseSha = process.env.BASE_SHA;
const prNumber = process.env.PR_NUMBER;
const repository = process.env.GITHUB_REPOSITORY ?? "open-mapsight/mapsight";

if (!baseSha || !prNumber) {
	console.error("BASE_SHA and PR_NUMBER are required.");
	process.exit(1);
}

const repoRoot = process.cwd();
const changesetPath = path.join(
	repoRoot,
	".changeset",
	`dependabot-${prNumber}.md`,
);

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

function packageJsonHasDependencyChanges(packageJsonPath: string): boolean {
	const diff = execFileSync(
		"git",
		["diff", `${baseSha}...HEAD`, "--", packageJsonPath],
		{encoding: "utf8"},
	);
	if (!diff.trim()) {
		return false;
	}

	return (
		/(^|\n)[+-]\s*"(dependencies|peerDependencies|devDependencies|optionalDependencies)"/m.test(
			diff,
		) || /(^|\n)[+-]\s*"[^"]+":\s*"[^"]+"/m.test(diff)
	);
}

function readPackageName(packageJsonPath: string): string | null {
	const absolutePath = path.join(repoRoot, packageJsonPath);
	const packageJson = JSON.parse(readFileSync(absolutePath, "utf8")) as {
		name?: unknown;
	};
	return typeof packageJson.name === "string" ? packageJson.name : null;
}

function buildSummaryLine(pullRequestNumber: string, repo: string): string {
	const url = `https://github.com/${repo}/pull/${pullRequestNumber}`;
	return `Bump dependencies from Dependabot ([#${pullRequestNumber}](${url})).`;
}

const changedPackageJsonPaths = gitDiffNameOnly("--", "**/package.json").filter(
	(file) => file !== "package.json",
);

const packages = new Map<string, "patch">();

for (const packageJsonPath of changedPackageJsonPaths) {
	if (!packageJsonHasDependencyChanges(packageJsonPath)) {
		continue;
	}

	const packageName = readPackageName(packageJsonPath);
	if (!packageName) {
		continue;
	}

	packages.set(packageName, "patch");
}

if (packages.size === 0) {
	console.log(
		"No versionable dependency changes detected; skipping changeset.",
	);
	process.exit(0);
}

const frontMatter = [...packages.keys()]
	.map((name) => `"${name}": patch`)
	.join("\n");
const summary = buildSummaryLine(prNumber, repository);
const contents = `---
${frontMatter}
---

${summary}
`;

mkdirSync(path.dirname(changesetPath), {recursive: true});

if (
	existsSync(changesetPath) &&
	readFileSync(changesetPath, "utf8") === contents
) {
	console.log(`Changeset already up to date: ${changesetPath}`);
	process.exit(0);
}

writeFileSync(changesetPath, contents);
console.log(
	`Wrote ${path.relative(repoRoot, changesetPath)} for ${packages.size} package(s).`,
);
