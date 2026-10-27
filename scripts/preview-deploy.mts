import {execFileSync, spawn} from "node:child_process";
import {once} from "node:events";
import {
	appendFileSync,
	createReadStream,
	lstatSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const REPOSITORY = "open-mapsight/mapsight";
const WORKFLOW = ".github/workflows/showcase-build.yml";

export interface BuildRun {
	id: number;
	path: string;
	event: string;
	status: string;
	conclusion: string;
	head_sha: string;
	head_branch: string;
	head_repository: {full_name: string};
	run_attempt: number;
}

export interface Pull {
	number: number;
	state: string;
	base: {ref: string};
	head: {sha: string; ref: string; repo: {full_name: string} | null};
}

interface Plan {
	action: "deploy" | "delete" | "reconcile" | "skip";
	target: string;
	sha?: string;
	run_id?: number;
	attempt?: number;
}

interface Result {
	status: string;
	target?: string;
	results?: Result[];
}

interface WorkflowEvent {
	action?: string;
	number?: number;
	inputs?: {run_id?: string};
	workflow_run?: {id: number};
}

function required(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is required`);
	return value;
}

async function api<T>(path: string, body?: unknown): Promise<T> {
	const response = await fetch(
		`https://api.github.com/repos/${REPOSITORY}${path}`,
		{
			method: body === undefined ? "GET" : "POST",
			headers: {
				Authorization: `Bearer ${required("GH_TOKEN")}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
			},
			...(body === undefined ? {} : {body: JSON.stringify(body)}),
			signal: AbortSignal.timeout(30_000),
		},
	);
	if (!response.ok)
		throw new Error(`GitHub ${path}: HTTP ${response.status}`);
	return (await response.json()) as T;
}

async function list<T>(path: string): Promise<T[]> {
	const result: T[] = [];
	for (let page = 1; ; page++) {
		const values = await api<T[]>(
			`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
		);
		result.push(...values);
		if (values.length < 100) return result;
	}
}

/** Associate builds with GitHub's current PR metadata, including fork PRs. */
export function deploymentTarget(
	run: BuildRun,
	pulls: Pull[],
	mainSha?: string,
): string | undefined {
	if (
		run.path !== WORKFLOW ||
		run.status !== "completed" ||
		run.conclusion !== "success" ||
		!/^[a-f0-9]{40}$/.test(run.head_sha)
	) {
		return undefined;
	}
	if (run.event === "push") {
		return run.head_branch === "main" &&
			run.head_repository.full_name === REPOSITORY &&
			run.head_sha === mainSha
			? "main"
			: undefined;
	}
	if (run.event !== "pull_request") return undefined;
	const pull = pulls.find(
		(candidate) =>
			candidate.state === "open" &&
			candidate.base.ref === "main" &&
			candidate.head.sha === run.head_sha &&
			candidate.head.ref === run.head_branch &&
			candidate.head.repo?.full_name === run.head_repository.full_name,
	);
	return pull ? `pr-${pull.number}` : undefined;
}

async function plan(): Promise<void> {
	if (required("GITHUB_REPOSITORY") !== REPOSITORY) {
		throw new Error(
			"Preview deployment is configured for a different repository",
		);
	}
	const event = JSON.parse(
		readFileSync(required("GITHUB_EVENT_PATH"), "utf8"),
	) as WorkflowEvent;
	let result: Plan = {action: "skip", target: "skip"};
	if (process.env.GITHUB_EVENT_NAME === "pull_request_target") {
		if (event.action === "closed" && Number.isSafeInteger(event.number)) {
			result = {action: "delete", target: `pr-${event.number}`};
		}
	} else if (
		process.env.GITHUB_EVENT_NAME === "schedule" ||
		(process.env.GITHUB_EVENT_NAME === "workflow_dispatch" &&
			!event.inputs?.run_id)
	) {
		result = {action: "reconcile", target: "reconcile"};
	} else {
		const runId = String(
			event.workflow_run?.id ?? event.inputs?.run_id ?? "",
		);
		if (!/^[1-9][0-9]*$/.test(runId))
			throw new Error("Invalid workflow run ID");
		const run = await api<BuildRun>(`/actions/runs/${runId}`);
		const pulls =
			run.event === "pull_request"
				? await list<Pull>("/pulls?state=open&base=main")
				: [];
		const mainSha =
			run.event === "push"
				? (await api<{sha: string}>("/commits/main")).sha
				: undefined;
		const target = deploymentTarget(run, pulls, mainSha);
		if (target) {
			result = {
				action: "deploy",
				target,
				sha: run.head_sha,
				run_id: run.id,
				attempt: run.run_attempt,
			};
		}
	}
	writeFileSync(required("PREVIEW_PLAN_FILE"), JSON.stringify(result));
	for (const [key, value] of Object.entries(result)) {
		appendFileSync(required("GITHUB_OUTPUT"), `${key}=${value}\n`);
	}
	console.log(`Preview plan: ${result.action} ${result.target}`);
}

function validateFiles(directory: string): void {
	let size = 0;
	let count = 0;
	function visit(path: string): void {
		for (const entry of readdirSync(path, {withFileTypes: true})) {
			const filename = join(path, entry.name);
			if (entry.isDirectory()) visit(filename);
			else if (entry.isFile()) {
				size += lstatSync(filename).size;
				count++;
			} else
				throw new Error(
					"Preview artifacts must contain regular files only",
				);
			if (size > 64 * 1024 * 1024 || count > 20_000) {
				throw new Error("Preview artifact exceeds its size limit");
			}
		}
	}
	visit(directory);
	if (!lstatSync(join(directory, "index.html")).isFile()) {
		throw new Error("Preview artifact is missing index.html");
	}
}

async function receive(request: Plan): Promise<Result> {
	const temporary = mkdtempSync(join(tmpdir(), "mapsight-preview-"));
	try {
		const host = required("PREVIEW_HOST");
		const user = required("PREVIEW_USER");
		if (!/^[a-zA-Z0-9.-]+$/.test(host) || !/^[a-z][a-z0-9-]*$/.test(user)) {
			throw new Error("Invalid preview SSH destination");
		}
		const key = join(temporary, "key");
		const knownHosts = join(temporary, "known_hosts");
		writeFileSync(key, `${required("PREVIEW_SSH_KEY").trim()}\n`, {
			mode: 0o600,
		});
		writeFileSync(knownHosts, required("PREVIEW_KNOWN_HOSTS"), {
			mode: 0o600,
		});
		let archive: string | undefined;
		if (request.action === "deploy") {
			const artifact = required("PREVIEW_ARTIFACT_DIR");
			validateFiles(artifact);
			archive = join(temporary, "artifact.tar.gz");
			execFileSync("tar", ["-czf", archive, "-C", artifact, "."]);
		}
		const ssh = spawn(
			"ssh",
			[
				"-i",
				key,
				"-o",
				`UserKnownHostsFile=${knownHosts}`,
				"-o",
				"StrictHostKeyChecking=yes",
				"-o",
				"IdentitiesOnly=yes",
				"-o",
				"BatchMode=yes",
				"-o",
				"ConnectTimeout=15",
				"-o",
				"ServerAliveInterval=15",
				"-o",
				"ServerAliveCountMax=4",
				`${user}@${host}`,
				"preview",
			],
			{timeout: 240_000},
		);
		let output = "";
		ssh.stdout.on("data", (data: Buffer) => {
			output += data.toString();
		});
		ssh.stderr.pipe(process.stderr);
		// The short-lived GitHub token travels inside SSH stdin, never in arguments/logs.
		ssh.stdin.on("error", () => {
			/* Early receiver exit is reported by its exit code. */
		});
		ssh.stdin.write(
			`${JSON.stringify({...request, token: required("GH_TOKEN")})}\n`,
		);
		if (archive) createReadStream(archive).pipe(ssh.stdin);
		else ssh.stdin.end();
		const [code] = (await once(ssh, "close")) as [
			number | null,
			string | null,
		];
		if (code !== 0)
			throw new Error(`Preview receiver exited with code ${code}`);
		return JSON.parse(output) as Result;
	} finally {
		rmSync(temporary, {recursive: true, force: true});
	}
}

function environment(target: string): string {
	return target === "main" ? "showcase" : `preview/${target}`;
}

async function inactive(target: string): Promise<void> {
	for (const deployment of await list<{id: number}>(
		`/deployments?environment=${encodeURIComponent(environment(target))}`,
	)) {
		const [status] = await api<{state: string}[]>(
			`/deployments/${deployment.id}/statuses?per_page=1`,
		);
		if (status?.state !== "inactive") {
			await api(`/deployments/${deployment.id}/statuses`, {
				state: "inactive",
				description: "Pull request closed; preview removed",
				auto_inactive: false,
			});
		}
	}
}

async function publish(): Promise<void> {
	const raw = JSON.parse(
		readFileSync(required("PREVIEW_PLAN_FILE"), "utf8"),
	) as Plan;
	const request: Plan = {
		...raw,
		...(raw.action === "deploy"
			? {run_id: Number(raw.run_id), attempt: Number(raw.attempt)}
			: {}),
	};
	if (request.action === "skip") return;
	if (request.action !== "deploy") {
		const result = await receive(request);
		for (const entry of result.results ?? [result]) {
			if (entry.status === "deleted" && entry.target)
				await inactive(entry.target);
		}
		console.log(`Preview ${result.status}`);
		return;
	}
	const domain = required("PREVIEW_BASE_DOMAIN");
	const showcase = required("SHOWCASE_HOST");
	if (![domain, showcase].every((host) => /^[a-z0-9.-]+$/.test(host))) {
		throw new Error("Invalid preview hostname");
	}
	const url = `https://${request.target === "main" ? showcase : `${request.target}.${domain}`}`;
	const deployment = await api<{id: number}>("/deployments", {
		ref: request.sha,
		environment: environment(request.target),
		auto_merge: false,
		required_contexts: [],
		transient_environment: request.target !== "main",
		production_environment: request.target === "main",
		payload: {target: request.target, run_id: request.run_id},
		description: "Static Mapsight showcase",
	});
	const status = (state: string, description: string) =>
		api(`/deployments/${deployment.id}/statuses`, {
			state,
			description,
			environment_url: url,
			auto_inactive: state === "success",
			log_url: `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
		});
	try {
		await status("in_progress", "Uploading static showcase");
		const result = await receive(request);
		if (result.status !== "deployed") {
			await status("inactive", "Build superseded or pull request closed");
			return;
		}
		const response = await fetch(`${url}/__preview.json`, {
			signal: AbortSignal.timeout(30_000),
		});
		const metadata = (await response.json()) as {sha?: string};
		if (!response.ok || metadata.sha !== request.sha) {
			throw new Error("Published revision failed the HTTPS smoke test");
		}
		await status("success", "Showcase is ready");
		if (process.env.GITHUB_STEP_SUMMARY) {
			appendFileSync(
				process.env.GITHUB_STEP_SUMMARY,
				`Preview: [${url}](${url})\n\nRevision: ${request.sha}\n`,
			);
		}
		console.log(`Published ${url}`);
	} catch (error) {
		await status("failure", "Preview deployment failed; see workflow logs");
		throw error;
	}
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	if (process.argv[2] === "plan") await plan();
	else if (process.argv[2] === "publish") await publish();
	else throw new Error("Expected plan or publish");
}
