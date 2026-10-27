import {execFileSync} from "node:child_process";
import {appendFileSync, existsSync, lstatSync, readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

import {retryGitHubRequest, targetsMain} from "./preview-deploy.mts";
import {
	type Change,
	PreviewProject,
	type ReviewLink,
	type Sources,
	reviewLinks,
	runtimeFile,
	showcaseRoutes,
} from "./preview-project.mts";

export {
	reviewLinks,
	runtimeImports,
	showcaseRoutes,
} from "./preview-project.mts";

const REPOSITORY = "open-mapsight/mapsight";
const MARKER = "<!-- mapsight-preview-review-links -->";
const BOT = "github-actions[bot]";
const MAIN = "https://showcase.open-mapsight.org";

interface Pull {
	state: string;
	changed_files: number;
	head: {sha: string};
	base: {ref: string};
	stack?: {base: {ref: string}} | null;
}
interface Deployment {
	id: number;
	sha: string;
	environment: string;
}
interface Status {
	state: string;
	environment_url: string;
}
interface Comment {
	id: number;
	body: string;
	user: {login: string; type: string};
}
export type GitHub = <T>(
	endpoint: string,
	method?: "GET" | "POST" | "PATCH" | "DELETE",
	body?: unknown,
) => Promise<T>;

function plain(value: string): string {
	return value
		.replace(/[\r\n]+/g, " ")
		.replace(/[@<>&[\]()*_`|\\]/g, "")
		.slice(0, 600);
}

export function renderReview(
	number: number,
	sha: string,
	links: ReviewLink[],
	mainPaths: Set<string>,
	truncated = false,
): string {
	const origin = previewOrigin(number);
	return [
		MARKER,
		"### 🤖 Mapsight review links",
		"",
		`Preview for \`${sha.slice(0, 7)}\` · [Open showcase](${origin})`,
		"",
		"Suggested starting points from the changed files and their showcase consumers:",
		"",
		"| Screen | PR preview | Current main | Suggested check |",
		"| --- | --- | --- | --- |",
		...links.map(
			(link) =>
				`| ${plain(link.label)} | [Open](${origin}${link.path}) | ${mainPaths.has(link.path) ? `[Compare](${MAIN}${link.path})` : "New screen"} | ${plain(link.check)} |`,
		),
		"",
		"<details><summary>Why these screens?</summary>",
		"",
		...links.map(
			(link) =>
				`- **${plain(link.label)}**: [${plain(link.evidence)}](https://github.com/${REPOSITORY}/blob/${sha}/${link.evidence.split("/").map(encodeURIComponent).join("/")})${link.distance === 100 ? " (sample of a shared layout change)" : ""}.`,
		),
		"",
		"</details>",
		"",
		truncated
			? "GitHub returned an incomplete changed-file list; additional screens may be affected.\n"
			: "",
		...new Set(links.flatMap((link) => (link.note ? [link.note] : []))),
		"These are suggested checks, not a verified reproduction of the issue. Current main can move independently of this PR; new behavior may need the PR author's setup steps.",
		"",
		"Updated after successful deployments. The commit above identifies this preview; a newer build may still be running.",
	]
		.join("\n")
		.replace(/\n{3,}/g, "\n\n");
}

function previewOrigin(number: number): string {
	if (!Number.isSafeInteger(number) || number < 1 || number > 999_999_999)
		throw new Error("Invalid PR number");
	return `https://pr-${number}.preview.open-mapsight.org`;
}

/** A fixed git revision is read as blobs, never checked out or executed. */
export function readSources(sha: string, directory = process.cwd()): Sources {
	if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Invalid source revision");
	const git = (args: string[], input?: string) =>
		execFileSync("git", args, {
			cwd: directory,
			input,
			maxBuffer: 64 * 1024 * 1024,
		});
	const tree = git(["ls-tree", "-r", "-z", sha]).toString("utf8");
	const entries = tree
		.split("\0")
		.filter(Boolean)
		.map((line) => {
			const [metadata, file] = line.split("\t") as [string, string];
			const [mode, , id] = metadata.split(" ");
			return {mode, id, file};
		})
		.filter(
			(entry) =>
				["100644", "100755"].includes(entry.mode ?? "") &&
				runtimeFile(entry.file),
		);
	const data = git(
		["cat-file", "--batch"],
		`${entries.map((entry) => entry.id).join("\n")}\n`,
	);
	const sources: Sources = new Map();
	let offset = 0;
	for (const entry of entries) {
		const end = data.indexOf(10, offset);
		const header = data.subarray(offset, end).toString("utf8");
		const size = Number(header.split(" ")[2]);
		if (
			!Number.isSafeInteger(size) ||
			size < 0 ||
			end < 0 ||
			!header.startsWith(`${entry.id} blob `)
		)
			throw new Error("Unexpected git blob response");
		offset = end + 1;
		if (size <= 1024 * 1024)
			sources.set(
				entry.file,
				data.subarray(offset, offset + size).toString("utf8"),
			);
		offset += size + 1;
	}
	return sources;
}

export function readWorkingSources(): Sources {
	return new Map(
		execFileSync(
			"git",
			["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
			{encoding: "utf8"},
		)
			.split("\0")
			.filter(
				(file) =>
					file &&
					runtimeFile(file) &&
					existsSync(file) &&
					lstatSync(file).isFile() &&
					lstatSync(file).size <= 1024 * 1024,
			)
			.map((file) => [file, readFileSync(file, "utf8")]),
	);
}

async function github<T>(
	endpoint: string,
	method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
	body?: unknown,
): Promise<T> {
	if (!process.env.GH_TOKEN) throw new Error("GH_TOKEN is required");
	const response = await retryGitHubRequest(
		() =>
			fetch(`https://api.github.com/repos/${REPOSITORY}${endpoint}`, {
				method,
				headers: {
					Authorization: `Bearer ${process.env.GH_TOKEN}`,
					Accept: "application/vnd.github+json",
					"Content-Type": "application/json",
					"X-GitHub-Api-Version": "2026-03-10",
					"Cache-Control": "no-cache",
				},
				...(body === undefined ? {} : {body: JSON.stringify(body)}),
				signal: AbortSignal.timeout(30_000),
			}),
		method !== "POST",
	);
	if (!response.ok)
		throw new Error(`GitHub ${endpoint}: HTTP ${response.status}`);
	return (response.status === 204 ? undefined : await response.json()) as T;
}

async function list<T>(api: GitHub, endpoint: string): Promise<T[]> {
	const result: T[] = [];
	for (let page = 1; ; page++) {
		const values = await api<T[]>(
			`${endpoint}${endpoint.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
		);
		result.push(...values);
		if (values.length < 100) return result;
	}
}

async function currentDeployment(
	api: GitHub,
	number: number,
	sha: string,
): Promise<Deployment | undefined> {
	const environment = `preview/pr-${number}`;
	const deployments = await list<Deployment>(
		api,
		`/deployments?sha=${sha}&environment=${encodeURIComponent(environment)}`,
	);
	for (const deployment of deployments) {
		if (deployment.sha !== sha || deployment.environment !== environment)
			continue;
		const [status] = await api<Status[]>(
			`/deployments/${deployment.id}/statuses?per_page=1`,
		);
		if (
			status?.state === "success" &&
			status.environment_url === previewOrigin(number)
		)
			return deployment;
	}
	return undefined;
}

function ownComments(comments: Comment[]): Comment[] {
	return comments.filter(
		(comment) =>
			comment.user.login === BOT &&
			comment.user.type === "Bot" &&
			comment.body.startsWith(MARKER),
	);
}

/** Injected boundaries let tests exercise races without GitHub writes or PR execution. */
export async function updateReview(options: {
	number: number;
	sha?: string;
	write: boolean;
	api: GitHub;
	sources: (sha: string) => Sources;
	liveSha: (origin: string) => Promise<string | undefined>;
	metadata?: Sources;
}): Promise<string> {
	const {number, api, write} = options;
	const origin = previewOrigin(number);
	const pull = await api<Pull>(`/pulls/${number}`);
	const comments = ownComments(
		await list<Comment>(api, `/issues/${number}/comments`),
	);
	if (pull.state !== "open") {
		if (!write) return "Closed PR: would remove review links";
		if ((await api<Pull>(`/pulls/${number}`)).state === "open")
			return "Skipped reopened PR";
		for (const comment of comments)
			await api(`/issues/comments/${comment.id}`, "DELETE");
		return "Closed PR: removed review links";
	}
	const sha = options.sha ?? pull.head.sha;
	if (!targetsMain(pull) || pull.head.sha !== sha)
		return "Skipped superseded PR head";
	const deployment = await currentDeployment(api, number, sha);
	if (!deployment || (await options.liveSha(origin)) !== sha)
		return "Skipped unavailable or superseded preview";
	const files = await list<Change>(api, `/pulls/${number}/files`);
	const links = reviewLinks(options.sources(sha), files, options.metadata);
	if (!links.length && files.length !== pull.changed_files)
		return "Skipped incomplete changed-file list; kept existing guidance";
	const main = await options.liveSha(MAIN);
	if (!main) throw new Error("The main showcase revision is unavailable");
	const mainPaths = new Set(
		showcaseRoutes(options.sources(main), options.metadata).map(
			(route) => route.path,
		),
	);
	const body = links.length
		? renderReview(
				number,
				sha,
				links,
				mainPaths,
				files.length !== pull.changed_files,
			)
		: "";
	if (!write)
		return body || "No showcase screens affected; no comment needed";
	// Recheck mutable state after the analysis and just before touching discussion.
	const current = await api<Pull>(`/pulls/${number}`);
	if (
		current.state !== "open" ||
		!targetsMain(current) ||
		current.head.sha !== sha ||
		!(await currentDeployment(api, number, sha)) ||
		(await options.liveSha(origin)) !== sha
	)
		return "Skipped preview changed during analysis";
	const latest = ownComments(
		await list<Comment>(api, `/issues/${number}/comments`),
	);
	const [existing, ...duplicates] = latest;
	if (!body) {
		for (const comment of latest)
			await api(`/issues/comments/${comment.id}`, "DELETE");
		return "No showcase screens affected; removed obsolete review links";
	}
	if (!existing) await api(`/issues/${number}/comments`, "POST", {body});
	else if (existing.body !== body)
		await api(`/issues/comments/${existing.id}`, "PATCH", {body});
	for (const comment of duplicates)
		await api(`/issues/comments/${comment.id}`, "DELETE");
	return body;
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	if (process.argv.includes("--check")) {
		new PreviewProject(readWorkingSources()).validate();
		console.log("Preview metadata and source references are valid");
	} else {
		const target = process.env.PREVIEW_TARGET ?? "";
		if (!/^pr-[1-9][0-9]{0,8}$/.test(target))
			throw new Error("PREVIEW_TARGET must be pr-NUMBER");
		const write = process.argv.includes("--write");
		if (
			write &&
			(process.env.GITHUB_ACTIONS !== "true" ||
				process.env.GITHUB_REPOSITORY !== REPOSITORY ||
				process.env.GITHUB_REF !== "refs/heads/main")
		) {
			throw new Error(
				"Comment writes require the trusted main-branch GitHub Actions job; local runs are dry runs",
			);
		}
		const result = await updateReview({
			number: Number(target.slice(3)),
			sha: process.env.PREVIEW_SHA,
			write,
			api: github,
			metadata: readWorkingSources(),
			sources(sha) {
				if (!/^[a-f0-9]{40}$/.test(sha))
					throw new Error("Invalid GitHub revision");
				execFileSync(
					"git",
					["fetch", "--no-tags", "--depth=1", "origin", sha],
					{stdio: "pipe", timeout: 60_000},
				);
				return readSources(sha);
			},
			async liveSha(origin) {
				const response = await fetch(`${origin}/__preview.json`, {
					cache: "no-store",
					signal: AbortSignal.timeout(30_000),
				});
				if (!response.ok) return undefined;
				const metadata = (await response.json()) as {sha?: string};
				return metadata.sha;
			},
		});
		console.log(result);
		if (process.env.GITHUB_STEP_SUMMARY)
			appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${result}\n`);
	}
}
