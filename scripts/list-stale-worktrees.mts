/**
 * List git worktrees that look safe to remove after squash-merged PRs.
 *
 * Prints candidates; does not delete anything.
 *
 * Usage:
 *   node scripts/list-stale-worktrees.mts
 *   node scripts/list-stale-worktrees.mts --json
 */
import {execFileSync} from "node:child_process";
import {resolve} from "node:path";

const json = process.argv.includes("--json");

function git(args: string[], cwd = process.cwd()): string {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

type Worktree = {
	path: string;
	head: string;
	branch: string | null;
	bare: boolean;
	detached: boolean;
};

function parseWorktrees(porcelain: string): Worktree[] {
	const blocks = porcelain.split("\n\n").filter(Boolean);
	const out: Worktree[] = [];
	for (const block of blocks) {
		const lines = block.split("\n");
		const map = new Map<string, string>();
		for (const line of lines) {
			const sp = line.indexOf(" ");
			if (sp === -1) {
				map.set(line, "");
			} else {
				map.set(line.slice(0, sp), line.slice(sp + 1));
			}
		}
		const path = map.get("worktree");
		const head = map.get("HEAD");
		if (!path || !head) {
			continue;
		}
		const branchRef = map.get("branch");
		out.push({
			path,
			head,
			branch: branchRef ? branchRef.replace(/^refs\/heads\//, "") : null,
			bare: map.has("bare"),
			detached: map.has("detached"),
		});
	}
	return out;
}

/** True when `branch@{upstream}` does not resolve (deleted remote + prune, or never set). */
function hasNoUpstream(branch: string): boolean {
	try {
		git(["rev-parse", "--verify", `${branch}@{upstream}`]);
		return false;
	} catch {
		return true;
	}
}

function isAncestorOfMain(commit: string): boolean {
	try {
		git(["merge-base", "--is-ancestor", commit, "origin/main"]);
		return true;
	} catch {
		return false;
	}
}

function main(): void {
	try {
		git(["rev-parse", "--verify", "origin/main"]);
	} catch {
		console.error("origin/main missing — run: git fetch origin");
		process.exitCode = 1;
		return;
	}

	const primary = resolve(git(["rev-parse", "--show-toplevel"]));
	const worktrees = parseWorktrees(git(["worktree", "list", "--porcelain"]));
	const candidates: Array<{
		path: string;
		branch: string | null;
		reasons: string[];
		removeHint: string;
	}> = [];

	for (const wt of worktrees) {
		if (resolve(wt.path) === primary) {
			continue;
		}
		const reasons: string[] = [];
		if (wt.detached && isAncestorOfMain(wt.head)) {
			reasons.push("detached HEAD is already on origin/main history");
		}
		if (wt.branch) {
			// Private / long-lived WIP branches often have no origin upstream on purpose.
			if (
				wt.branch.startsWith("private/") ||
				wt.branch.startsWith("wip/")
			) {
				continue;
			}
			if (hasNoUpstream(wt.branch)) {
				reasons.push(
					`branch '${wt.branch}' has no upstream (often deleted after merge)`,
				);
			}
		}
		if (reasons.length === 0) {
			continue;
		}
		// Prefer the gone-upstream signal; detached+ancestor is secondary.
		const strong = reasons.some((r) => r.includes("no upstream"));
		if (!strong && !wt.detached) {
			continue;
		}
		candidates.push({
			path: wt.path,
			branch: wt.branch,
			reasons,
			removeHint: `git worktree remove --force ${JSON.stringify(wt.path)}`,
		});
	}

	if (json) {
		console.log(JSON.stringify({primary, candidates}, null, 2));
		return;
	}

	if (candidates.length === 0) {
		console.log(
			"No stale worktree candidates (based on missing upstream / detached).",
		);
		console.log("Tip: git fetch --prune origin, then re-run.");
		return;
	}

	console.log("Stale worktree candidates (review before removing):\n");
	for (const c of candidates) {
		console.log(`- ${c.path}`);
		console.log(`  branch: ${c.branch ?? "(detached)"}`);
		for (const r of c.reasons) {
			console.log(`  · ${r}`);
		}
		console.log(`  remove: ${c.removeHint}`);
		if (c.branch) {
			console.log(`  branch: git branch -D ${JSON.stringify(c.branch)}`);
		}
		console.log("");
	}
	console.log(
		"After removing a worktree that a host app `link:`ed, retarget links, kill Vite, and clear node_modules/.vite.",
	);
}

main();
