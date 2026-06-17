import {execFile as execFileCallback} from "node:child_process";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import pidtree from "pidtree";
import pidusage from "pidusage";
import {chromium, firefox, webkit} from "playwright";
import type {BrowserType, Page} from "playwright";
import {createServer} from "vite";

const execFile = promisify(execFileCallback);

type Backend = "vsc-canvas" | "ol-canvas-flat" | "ol-webgl-flat";
type RenderEngine = "chromium" | "firefox" | "webkit";
type Scenario = "points" | "mixed";
type Workload = "hover" | "mutate" | "view" | "zoom";

type BenchOptions = {
	backend: Backend;
	featureCount: number;
	scenario: Scenario;
	updates: number;
	viewportHeight: number;
	viewportWidth: number;
	workload: Workload;
};

type BenchResult = BenchOptions & {
	error?: string;
	frameP95Ms?: number;
	frames?: number;
	initialRenderMs?: number;
	memoryAfterBytes?: number | null;
	memoryBeforeBytes?: number | null;
	memoryPeakBytes?: number | null;
	updateRenderMs?: number;
	vscMetrics?: {
		declarationMs: number;
		level1Hits: number;
		level1Misses: number;
		level2Hits: number;
		level2Misses: number;
		materializationMs: number;
		totalMs: number;
	};
};

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const FIXTURE_PATH = "/__tests__/render-backends.fixture.html";
const PROCESS_SAMPLE_INTERVAL_MS = Number(
	process.env.BENCH_RENDER_PROCESS_SAMPLE_INTERVAL_MS || 25,
);
const PROCESS_SETTLE_MS = Number(
	process.env.BENCH_RENDER_PROCESS_SETTLE_MS || 100,
);
const CLOSE_TIMEOUT_MS = Number(
	process.env.BENCH_RENDER_CLOSE_TIMEOUT_MS || 5000,
);
const UPDATES = Number(process.env.BENCH_RENDER_UPDATES || 4);
const HEADLESS = process.env.BENCH_RENDER_HEADLESS !== "0";
const CHROMIUM_CHANNEL = process.env.BENCH_RENDER_CHROMIUM_CHANNEL;
const VIEWPORT = parseViewport(process.env.BENCH_RENDER_VIEWPORT || "1024x768");

function parseList<T extends string>(
	value: string | undefined,
	fallback: T[],
	allowed: ReadonlySet<string>,
): T[] {
	const items = (value ? value.split(",") : fallback)
		.map((item) => String(item).trim())
		.filter(Boolean);

	return items.filter((item): item is T => allowed.has(item));
}

function parseFeatureCounts(): number[] {
	const values = (process.env.BENCH_RENDER_FEATURES || "1000,10000")
		.split(",")
		.map((value) => Number(value.trim()))
		.filter((value) => Number.isFinite(value) && value > 0);

	return values.length > 0 ? values : [1000, 10000];
}

function parseViewport(value: string): {height: number; width: number} {
	const match = /^(\d+)x(\d+)$/i.exec(value.trim());

	if (!match) {
		return {height: 768, width: 1024};
	}

	const width = Number(match[1]);
	const height = Number(match[2]);

	return Number.isFinite(width) &&
		Number.isFinite(height) &&
		width > 0 &&
		height > 0
		? {height, width}
		: {height: 768, width: 1024};
}

function formatBytes(bytes?: number | null): string {
	if (bytes == null || !Number.isFinite(bytes)) {
		return "n/a";
	}

	return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function formatMs(value?: number): string {
	return value == null || !Number.isFinite(value)
		? "n/a"
		: `${value.toFixed(2)}ms`;
}

function toPid(pidValue: unknown): number | null {
	if (typeof pidValue !== "number" || !Number.isFinite(pidValue)) {
		return null;
	}

	const normalized = Math.trunc(pidValue);

	return normalized > 0 ? normalized : null;
}

async function closeWithTimeout(
	label: string,
	close: () => Promise<unknown>,
): Promise<void> {
	let timeout: NodeJS.Timeout | undefined;

	try {
		await Promise.race([
			close(),
			new Promise((_, reject) => {
				timeout = setTimeout(
					() => reject(new Error(`${label} close timed out`)),
					CLOSE_TIMEOUT_MS,
				);
			}),
		]);
	} catch (error) {
		console.warn(
			`[render-bench] ${label} cleanup did not finish: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	} finally {
		if (timeout != null) {
			clearTimeout(timeout);
		}
	}
}

async function readProcessRssBytes(pid: number | null): Promise<number | null> {
	if (pid == null) {
		return null;
	}

	try {
		const stats = await pidusage(pid);
		return Number.isFinite(stats.memory) ? stats.memory : null;
	} catch {
		return null;
	}
}

async function getProcessTreePids(rootPid: number | null): Promise<number[]> {
	if (rootPid == null) {
		return [];
	}

	try {
		const tree = await pidtree(rootPid, {root: true});

		const pids = [...new Set(tree)]
			.map((pid) => toPid(pid))
			.filter((pid): pid is number => pid != null);

		return pids.length > 0 ? pids : [rootPid];
	} catch {
		return [rootPid];
	}
}

async function readProcessTreeRssBytes(
	rootPid: number | null,
): Promise<number | null> {
	const pids = await getProcessTreePids(rootPid);

	if (pids.length === 0) {
		return null;
	}

	const samples = await Promise.allSettled(
		pids.map(async (pid) => readProcessRssBytes(pid)),
	);
	let totalRssBytes = 0;
	let hasAnySample = false;

	for (const sample of samples) {
		if (sample.status !== "fulfilled" || sample.value == null) {
			continue;
		}

		totalRssBytes += sample.value;
		hasAnySample = true;
	}

	return hasAnySample ? totalRssBytes : null;
}

async function debugProcessTree(
	rootPid: number | null,
	label: string,
): Promise<void> {
	if (process.env.BENCH_RENDER_DEBUG_PIDS !== "1") {
		return;
	}

	const pids = await getProcessTreePids(rootPid);
	console.log(`\n[pid-debug] ${label}`);
	console.log(`[pid-debug] root=${rootPid ?? "n/a"} tree=${pids.join(", ")}`);

	if (process.platform === "win32" || pids.length === 0) {
		return;
	}

	try {
		const {stdout} = await execFile("ps", [
			"-o",
			"pid=,ppid=,rss=,comm=",
			"-p",
			pids.join(","),
		]);

		stdout
			.trim()
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean)
			.forEach((row) => console.log(`[pid-debug] ${row}`));
	} catch (error) {
		console.log(
			`[pid-debug] unable to inspect process names: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

async function runWithMemory<T>(
	browserPid: number | null,
	work: () => Promise<T>,
): Promise<
	T & {
		memoryAfterBytes: number | null;
		memoryBeforeBytes: number | null;
		memoryPeakBytes: number | null;
	}
> {
	await new Promise((resolve) => setTimeout(resolve, PROCESS_SETTLE_MS));

	const memoryBeforeBytes = await readProcessTreeRssBytes(browserPid);
	let memoryPeakBytes = memoryBeforeBytes;
	let polling = true;
	let pollingInFlight = false;

	const pollInterval = setInterval(() => {
		if (pollingInFlight || !polling) {
			return;
		}

		pollingInFlight = true;

		void readProcessTreeRssBytes(browserPid)
			.then((rssBytes) => {
				if (rssBytes == null) {
					return;
				}

				memoryPeakBytes =
					memoryPeakBytes == null
						? rssBytes
						: Math.max(memoryPeakBytes, rssBytes);
			})
			.finally(() => {
				pollingInFlight = false;
			});
	}, PROCESS_SAMPLE_INTERVAL_MS);

	try {
		const result = await work();
		await new Promise((resolve) => setTimeout(resolve, PROCESS_SETTLE_MS));
		const memoryAfterBytes = await readProcessTreeRssBytes(browserPid);

		if (memoryAfterBytes != null) {
			memoryPeakBytes =
				memoryPeakBytes == null
					? memoryAfterBytes
					: Math.max(memoryPeakBytes, memoryAfterBytes);
		}

		return {
			...result,
			memoryAfterBytes,
			memoryBeforeBytes,
			memoryPeakBytes,
		};
	} finally {
		polling = false;
		clearInterval(pollInterval);
	}
}

async function runPageBenchmark(
	page: Page,
	options: BenchOptions,
): Promise<
	Omit<
		BenchResult,
		"memoryAfterBytes" | "memoryBeforeBytes" | "memoryPeakBytes"
	>
> {
	try {
		const result = await page.evaluate((benchOptions) => {
			if (typeof window.__runRenderBench !== "function") {
				throw new Error("render benchmark fixture did not initialize");
			}

			return window.__runRenderBench(benchOptions);
		}, options);

		return {
			...options,
			...result,
		};
	} catch (error) {
		return {
			...options,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function runEngineBenchmark(
	engine: string,
	launcher: BrowserType,
	fixtureUrl: string,
	optionsList: BenchOptions[],
): Promise<Array<BenchResult & {engine: string}>> {
	const browserServer = await launcher.launchServer({
		...(engine === "chromium" && CHROMIUM_CHANNEL
			? {channel: CHROMIUM_CHANNEL}
			: {}),
		headless: HEADLESS,
	});
	const browserPid = toPid(browserServer.process()?.pid);
	const browser = await launcher.connect(browserServer.wsEndpoint());

	try {
		await debugProcessTree(browserPid, `${engine} before`);

		const results: Array<BenchResult & {engine: string}> = [];

		for (const options of optionsList) {
			const context = await browser.newContext({
				viewport: VIEWPORT,
			});

			try {
				const page = await context.newPage();
				await page.goto(fixtureUrl, {waitUntil: "networkidle"});

				const result = await runWithMemory(browserPid, async () =>
					runPageBenchmark(page, options),
				);
				results.push({...result, engine});
			} finally {
				await closeWithTimeout("context", () => context.close());
			}
		}

		await debugProcessTree(browserPid, `${engine} after`);

		return results;
	} finally {
		await closeWithTimeout("browser", () => browser.close());
		await closeWithTimeout("browser server", () => browserServer.close());
	}
}

function createOptionsList(): BenchOptions[] {
	const featureCounts = parseFeatureCounts();
	const backends = parseList<Backend>(
		process.env.BENCH_RENDER_BACKENDS,
		["vsc-canvas", "ol-canvas-flat", "ol-webgl-flat"],
		new Set(["vsc-canvas", "ol-canvas-flat", "ol-webgl-flat"]),
	);
	const scenarios = parseList<Scenario>(
		process.env.BENCH_RENDER_SCENARIOS,
		["points", "mixed"],
		new Set(["points", "mixed"]),
	);
	const workloads = parseList<Workload>(
		process.env.BENCH_RENDER_WORKLOADS,
		["mutate"],
		new Set(["hover", "mutate", "view", "zoom"]),
	);

	return workloads.flatMap((workload) =>
		scenarios.flatMap((scenario) =>
			featureCounts.flatMap((featureCount) =>
				backends.map((backend) => ({
					backend,
					featureCount,
					scenario,
					updates: UPDATES,
					viewportHeight: VIEWPORT.height,
					viewportWidth: VIEWPORT.width,
					workload,
				})),
			),
		),
	);
}

function createEngines() {
	const names = parseList<RenderEngine>(
		process.env.BENCH_RENDER_ENGINES,
		["chromium"],
		new Set(["chromium", "firefox", "webkit"]),
	);
	const launchers: Record<RenderEngine, BrowserType> = {
		chromium,
		firefox,
		webkit,
	};

	return names.map((engine) => ({
		engine,
		launcher: launchers[engine],
	}));
}

function printResults(results: Array<BenchResult & {engine: string}>): void {
	console.log(
		`\nRender backend benchmark ` +
			`(lower is better, updates=${UPDATES}):\n`,
	);
	console.log(
		[
			"engine".padEnd(10),
			"workload".padEnd(8),
			"scenario".padEnd(8),
			"viewport".padEnd(9),
			"features".padStart(8),
			"backend".padEnd(15),
			"initial".padStart(12),
			"updates".padStart(12),
			"frame p95".padStart(12),
			"memory peak".padStart(12),
			"VSC L1".padStart(12),
			"VSC total".padStart(12),
		].join(" "),
	);

	for (const result of results) {
		const vscL1 =
			result.vscMetrics == null
				? "n/a"
				: `${result.vscMetrics.level1Hits}/${result.vscMetrics.level1Misses}`;

		console.log(
			[
				result.engine.padEnd(10),
				result.workload.padEnd(8),
				result.scenario.padEnd(8),
				`${result.viewportWidth}x${result.viewportHeight}`.padEnd(9),
				String(result.featureCount).padStart(8),
				result.backend.padEnd(15),
				(result.error
					? "ERROR"
					: formatMs(result.initialRenderMs)
				).padStart(12),
				(result.error
					? "ERROR"
					: formatMs(result.updateRenderMs)
				).padStart(12),
				(result.error ? "ERROR" : formatMs(result.frameP95Ms)).padStart(
					12,
				),
				formatBytes(result.memoryPeakBytes).padStart(12),
				vscL1.padStart(12),
				formatMs(result.vscMetrics?.totalMs).padStart(12),
			].join(" "),
		);

		if (result.error) {
			console.log(`  ${result.backend} failed: ${result.error}`);
		}
	}

	console.log("\nEnvironment variables:");
	console.log(
		`- BENCH_RENDER_FEATURES=${process.env.BENCH_RENDER_FEATURES ?? "1000,10000"}`,
	);
	console.log(
		`- BENCH_RENDER_BACKENDS=${process.env.BENCH_RENDER_BACKENDS ?? "vsc-canvas,ol-canvas-flat,ol-webgl-flat"}`,
	);
	console.log(
		`- BENCH_RENDER_SCENARIOS=${process.env.BENCH_RENDER_SCENARIOS ?? "points,mixed"}`,
	);
	console.log(
		`- BENCH_RENDER_WORKLOADS=${process.env.BENCH_RENDER_WORKLOADS ?? "mutate"}`,
	);
	console.log(
		`- BENCH_RENDER_ENGINES=${process.env.BENCH_RENDER_ENGINES ?? "chromium"}`,
	);
	console.log(`- BENCH_RENDER_UPDATES=${UPDATES}`);
	console.log(`- BENCH_RENDER_VIEWPORT=${VIEWPORT.width}x${VIEWPORT.height}`);
	console.log(`- BENCH_RENDER_HEADLESS=${HEADLESS ? "1" : "0"}`);
	console.log(`- BENCH_RENDER_CHROMIUM_CHANNEL=${CHROMIUM_CHANNEL ?? ""}`);
}

async function run(): Promise<void> {
	const server = await createServer({
		clearScreen: false,
		logLevel: "error",
		root: PACKAGE_ROOT,
		server: {host: "127.0.0.1"},
	});

	try {
		await server.listen();

		const baseUrl = server.resolvedUrls?.local[0];
		if (!baseUrl) {
			throw new Error("Vite did not expose a local server URL");
		}

		const fixtureUrl = new URL(FIXTURE_PATH, baseUrl).toString();
		const optionsList = createOptionsList();
		const engines = createEngines();
		const results: Array<BenchResult & {engine: string}> = [];

		for (const {engine, launcher} of engines) {
			results.push(
				...(await runEngineBenchmark(
					engine,
					launcher,
					fixtureUrl,
					optionsList,
				)),
			);
		}

		printResults(results);
	} finally {
		await closeWithTimeout("vite server", () => server.close());
	}
}

await run();
