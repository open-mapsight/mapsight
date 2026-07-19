import {execFileSync} from "node:child_process";
import {existsSync, readdirSync} from "node:fs";
import path from "node:path";

const eventName =
	process.env.EVENT_NAME ?? process.env.GITHUB_EVENT_NAME ?? "push";
const prBaseSha = process.env.PR_BASE_SHA;
const prNumber = process.env.PR_NUMBER;
const prUser = process.env.PR_USER;

const dependencyFilePattern =
	/^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|.+\/package\.json)$/;

function gitDiffNameOnly(baseSha: string): string[] {
	const output = execFileSync(
		"git",
		["diff", "--name-only", `${baseSha}...HEAD`],
		{encoding: "utf8"},
	);
	return output
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
}

function isDependencyOnlyPullRequest(baseSha: string): boolean {
	const changedFiles = gitDiffNameOnly(baseSha);
	if (changedFiles.length === 0) {
		return false;
	}

	return changedFiles.every((file) => dependencyFilePattern.test(file));
}

function runChangesetStatus(): void {
	execFileSync("pnpm", ["changeset", "status", "--since=main"], {
		stdio: "inherit",
	});
}

if (eventName !== "pull_request") {
	runChangesetStatus();
	process.exit(0);
}

if (!prBaseSha || !prNumber || !prUser) {
	console.error(
		"PR_BASE_SHA, PR_NUMBER, and PR_USER are required for pull_request events.",
	);
	process.exit(1);
}

if (prUser === "dependabot[bot]" && isDependencyOnlyPullRequest(prBaseSha)) {
	const changesetDir = path.join(".changeset");
	const prefix = `dependabot-${prNumber}`;
	const hasDependabotChangeset =
		existsSync(changesetDir) &&
		readdirSync(changesetDir).some(
			(entry) =>
				entry === `${prefix}.md` || entry.startsWith(`${prefix}-`),
		);

	if (hasDependabotChangeset) {
		runChangesetStatus();
	} else {
		console.log(
			"::notice::Dependabot dependency update — waiting for auto-changeset workflow.",
		);
	}

	process.exit(0);
}

runChangesetStatus();
