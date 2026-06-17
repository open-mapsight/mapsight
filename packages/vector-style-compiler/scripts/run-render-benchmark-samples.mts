import {spawn} from "node:child_process";
import {createWriteStream} from "node:fs";
import {appendFile, mkdir, writeFile} from "node:fs/promises";
import {basename, relative, resolve} from "node:path";
import {performance} from "node:perf_hooks";

type Backend = "vsc-canvas" | "ol-canvas-flat" | "ol-webgl-flat";
type BrowserEngine = "chromium" | "firefox" | "webkit";
type Scenario = "points" | "mixed";
type Workload = "hover" | "mutate" | "view" | "zoom";

type BenchRow = {
	backend: Backend;
	engine: BrowserEngine;
	featureCount: number;
	frameP95Ms: number | null;
	initialRenderMs: number | null;
	memoryPeakMb: number | null;
	runElapsedMs: number;
	runIndex: number;
	scenario: Scenario;
	sourceLog: string;
	updateRenderMs: number | null;
	viewport: string;
	vscL1Hits: number | null;
	vscL1Misses: number | null;
	vscTotalMs: number | null;
	workload: Workload;
};

type RunRecord = {
	backends: Backend[];
	completionReason: "closed" | "completed-output" | "timeout";
	elapsedMs: number;
	engine: BrowserEngine;
	exitCode: number | null;
	featureCounts: number[];
	logFile: string;
	runIndex: number;
	scenario: Scenario;
	startedAt: string;
	workload: Workload;
};
type CsvValue = number | string | null | undefined;
type TableCells = [
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
];

const packageRoot = resolve(import.meta.dirname, "..");
const timestamp = new Date()
	.toISOString()
	.replaceAll(":", "-")
	.replace(/\..+$/, "");
const outputDir = resolve(
	packageRoot,
	process.env.BENCH_RENDER_SAMPLE_OUTPUT_DIR ??
		`tmp/render-backend-benchmarks/${timestamp}`,
);
const rawDir = resolve(outputDir, "raw");
const rowsJsonlFile = resolve(outputDir, "rows.jsonl");
const rowsCsvFile = resolve(outputDir, "rows.csv");
const runsJsonlFile = resolve(outputDir, "runs.jsonl");
const summaryCsvFile = resolve(outputDir, "summary.csv");
const manifestFile = resolve(outputDir, "manifest.json");

const backends = parseList<Backend>(
	process.env.BENCH_RENDER_BACKENDS,
	["vsc-canvas", "ol-canvas-flat", "ol-webgl-flat"],
	new Set(["vsc-canvas", "ol-canvas-flat", "ol-webgl-flat"]),
);
const engines = parseList<BrowserEngine>(
	process.env.BENCH_RENDER_ENGINES,
	["chromium", "firefox", "webkit"],
	new Set(["chromium", "firefox", "webkit"]),
);
const featureCounts = parseFeatureCounts();
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
const sampleRuns = parsePositiveInteger(
	process.env.BENCH_RENDER_SAMPLE_RUNS,
	5,
);
const splitTimeoutMs = parsePositiveInteger(
	process.env.BENCH_RENDER_SAMPLE_TIMEOUT_MS,
	300_000,
);
const completedOutputGraceMs = parsePositiveInteger(
	process.env.BENCH_RENDER_SAMPLE_COMPLETE_GRACE_MS,
	2_000,
);
const viewport = process.env.BENCH_RENDER_VIEWPORT ?? "1600x900";

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

function parsePositiveInteger(
	value: string | undefined,
	fallback: number,
): number {
	const parsed = Number(value);

	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseMs(value: string): number | null {
	if (value === "n/a" || value === "ERROR") {
		return null;
	}

	const parsed = Number(value.replace(/ms$/, ""));

	return Number.isFinite(parsed) ? parsed : null;
}

function parseMb(value: string): number | null {
	if (value === "n/a") {
		return null;
	}

	const parsed = Number(value.replace(/MB$/, ""));

	return Number.isFinite(parsed) ? parsed : null;
}

function parseVscL1(value: string): {
	hits: number | null;
	misses: number | null;
} {
	if (value === "n/a") {
		return {hits: null, misses: null};
	}

	const parts = value.split("/");
	const hits = Number(parts[0]);
	const misses = Number(parts[1]);

	return Number.isFinite(hits) && Number.isFinite(misses)
		? {hits, misses}
		: {hits: null, misses: null};
}

function parseRows(
	output: string,
	run: RunRecord,
	runElapsedMs: number,
): BenchRow[] {
	return output
		.split("\n")
		.map((line) => line.trim())
		.flatMap((line): BenchRow[] => {
			const cells = line.split(/\s+/);

			if (cells.length !== 12) {
				return [];
			}

			const [
				engine,
				workload,
				scenario,
				rowViewport,
				featureCount,
				backend,
				initial,
				updates,
				frameP95,
				memoryPeak,
				vscL1,
				vscTotal,
			] = cells as TableCells;

			if (
				!isBrowserEngine(engine) ||
				!isWorkload(workload) ||
				!isScenario(scenario) ||
				!isBackend(backend)
			) {
				return [];
			}

			const parsedFeatureCount = Number(featureCount);
			if (!Number.isFinite(parsedFeatureCount)) {
				return [];
			}

			const {hits, misses} = parseVscL1(vscL1);

			return [
				{
					backend,
					engine,
					featureCount: parsedFeatureCount,
					frameP95Ms: parseMs(frameP95),
					initialRenderMs: parseMs(initial),
					memoryPeakMb: parseMb(memoryPeak),
					runElapsedMs,
					runIndex: run.runIndex,
					scenario,
					sourceLog: run.logFile,
					updateRenderMs: parseMs(updates),
					viewport: rowViewport,
					vscL1Hits: hits,
					vscL1Misses: misses,
					vscTotalMs: parseMs(vscTotal),
					workload,
				},
			];
		});
}

function isBackend(value: string): value is Backend {
	return (
		value === "vsc-canvas" ||
		value === "ol-canvas-flat" ||
		value === "ol-webgl-flat"
	);
}

function isBrowserEngine(value: string): value is BrowserEngine {
	return value === "chromium" || value === "firefox" || value === "webkit";
}

function isScenario(value: string): value is Scenario {
	return value === "points" || value === "mixed";
}

function isWorkload(value: string): value is Workload {
	return (
		value === "hover" ||
		value === "mutate" ||
		value === "view" ||
		value === "zoom"
	);
}

function csvEscape(value: CsvValue): string {
	if (value == null) {
		return "";
	}

	const stringValue = String(value);

	return /[",\n]/.test(stringValue)
		? `"${stringValue.replaceAll('"', '""')}"`
		: stringValue;
}

function toCsvRow(values: CsvValue[]): string {
	return values.map(csvEscape).join(",");
}

function rowToCsv(row: BenchRow): string {
	return toCsvRow([
		row.runIndex,
		row.engine,
		row.scenario,
		row.workload,
		row.viewport,
		row.featureCount,
		row.backend,
		row.initialRenderMs,
		row.updateRenderMs,
		row.frameP95Ms,
		row.memoryPeakMb,
		row.vscL1Hits,
		row.vscL1Misses,
		row.vscTotalMs,
		row.runElapsedMs,
		row.sourceLog,
	]);
}

function median(values: number[]): number | null {
	if (values.length === 0) {
		return null;
	}

	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);

	if (sorted.length % 2 === 0) {
		const lower = sorted[middle - 1];
		const upper = sorted[middle];

		return lower == null || upper == null ? null : (lower + upper) / 2;
	}

	return sorted[middle] ?? null;
}

function mean(values: number[]): number | null {
	if (values.length === 0) {
		return null;
	}

	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number | null {
	if (values.length < 2) {
		return null;
	}

	const average = mean(values);
	if (average == null) {
		return null;
	}

	const variance =
		values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
		(values.length - 1);

	return Math.sqrt(variance);
}

function numericValues(
	rows: BenchRow[],
	key: keyof Pick<
		BenchRow,
		| "frameP95Ms"
		| "initialRenderMs"
		| "memoryPeakMb"
		| "updateRenderMs"
		| "vscTotalMs"
	>,
): number[] {
	return rows
		.map((row) => row[key])
		.filter((value): value is number => typeof value === "number");
}

async function writeSummary(rows: BenchRow[]): Promise<void> {
	const groups = new Map<string, BenchRow[]>();

	for (const row of rows) {
		const groupKey = [
			row.engine,
			row.scenario,
			row.workload,
			row.viewport,
			row.featureCount,
			row.backend,
		].join("|");
		groups.set(groupKey, [...(groups.get(groupKey) ?? []), row]);
	}

	const header = toCsvRow([
		"engine",
		"scenario",
		"workload",
		"viewport",
		"featureCount",
		"backend",
		"n",
		"initialMedianMs",
		"initialMeanMs",
		"initialStdDevMs",
		"updateMedianMs",
		"updateMeanMs",
		"updateStdDevMs",
		"frameP95MedianMs",
		"frameP95MeanMs",
		"frameP95StdDevMs",
		"memoryPeakMedianMb",
		"vscTotalMedianMs",
	]);
	const lines = [header];

	for (const [groupKey, groupRows] of [...groups.entries()].sort()) {
		const [engine, scenario, workload, rowViewport, featureCount, backend] =
			groupKey.split("|");
		const initial = numericValues(groupRows, "initialRenderMs");
		const updates = numericValues(groupRows, "updateRenderMs");
		const frameP95 = numericValues(groupRows, "frameP95Ms");
		const memoryPeak = numericValues(groupRows, "memoryPeakMb");
		const vscTotal = numericValues(groupRows, "vscTotalMs");

		lines.push(
			toCsvRow([
				engine,
				scenario,
				workload,
				rowViewport,
				featureCount,
				backend,
				groupRows.length,
				median(initial),
				mean(initial),
				standardDeviation(initial),
				median(updates),
				mean(updates),
				standardDeviation(updates),
				median(frameP95),
				mean(frameP95),
				standardDeviation(frameP95),
				median(memoryPeak),
				median(vscTotal),
			]),
		);
	}

	await writeFile(summaryCsvFile, `${lines.join("\n")}\n`);
}

async function runBenchmark(
	runIndex: number,
	engine: BrowserEngine,
	scenario: Scenario,
	workload: Workload,
	runFeatureCounts: number[],
	runBackends: Backend[],
): Promise<{record: RunRecord; rows: BenchRow[]}> {
	const startedAt = new Date().toISOString();
	const logFile = resolve(
		rawDir,
		[
			String(runIndex).padStart(3, "0"),
			engine,
			scenario,
			workload,
			runFeatureCounts.join("+"),
			runBackends.join("+"),
		].join("-") + ".log",
	);
	await writeFile(logFile, "");
	const logStream = createWriteStream(logFile, {flags: "w"});
	const env = {
		...process.env,
		BENCH_RENDER_BACKENDS: runBackends.join(","),
		BENCH_RENDER_CHROMIUM_CHANNEL:
			process.env.BENCH_RENDER_CHROMIUM_CHANNEL ?? "chrome",
		BENCH_RENDER_ENGINES: engine,
		BENCH_RENDER_FEATURES: runFeatureCounts.join(","),
		BENCH_RENDER_HEADLESS: process.env.BENCH_RENDER_HEADLESS ?? "0",
		BENCH_RENDER_SCENARIOS: scenario,
		BENCH_RENDER_VIEWPORT: viewport,
		BENCH_RENDER_WORKLOADS: workload,
	};
	const start = performance.now();
	const {completionReason, exitCode, output} = await new Promise<{
		completionReason: RunRecord["completionReason"];
		exitCode: number | null;
		output: string;
	}>((resolvePromise) => {
		const child = spawn(
			process.execPath,
			["__tests__/render-backends.bench.ts"],
			{
				cwd: packageRoot,
				detached: process.platform !== "win32",
				env,
				stdio: ["ignore", "pipe", "pipe"],
			},
		);
		const chunks: string[] = [];
		let completedOutputTimer: NodeJS.Timeout | undefined;
		let finished = false;

		const killChild = () => {
			if (child.pid == null || child.killed) {
				return;
			}

			try {
				if (process.platform === "win32") {
					child.kill("SIGTERM");
				} else {
					process.kill(-child.pid, "SIGTERM");
				}
			} catch {
				child.kill("SIGTERM");
			}

			setTimeout(() => {
				if (child.pid == null || child.killed) {
					return;
				}

				try {
					if (process.platform === "win32") {
						child.kill("SIGKILL");
					} else {
						process.kill(-child.pid, "SIGKILL");
					}
				} catch {
					child.kill("SIGKILL");
				}
			}, 2_000).unref();
		};
		const finish = (
			completionReason: RunRecord["completionReason"],
			exitCode: number | null,
		) => {
			if (finished) {
				return;
			}

			finished = true;
			clearTimeout(timeout);
			if (completedOutputTimer != null) {
				clearTimeout(completedOutputTimer);
			}
			logStream.end();

			if (completionReason !== "closed") {
				killChild();
			}

			resolvePromise({
				completionReason,
				exitCode,
				output: chunks.join(""),
			});
		};
		const markOutput = (chunk: string) => {
			chunks.push(chunk);
			logStream.write(chunk);

			if (chunk.includes("Environment variables:")) {
				if (completedOutputTimer != null) {
					clearTimeout(completedOutputTimer);
				}
				completedOutputTimer = setTimeout(
					() => finish("completed-output", null),
					completedOutputGraceMs,
				);
			}
		};
		const timeout = setTimeout(() => {
			console.error(
				`\n[render-bench] ${engine}/${scenario} timed out after ${splitTimeoutMs}ms`,
			);
			finish("timeout", null);
		}, splitTimeoutMs);

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk: string) => {
			process.stdout.write(chunk);
			markOutput(chunk);
		});
		child.stderr.on("data", (chunk: string) => {
			process.stderr.write(chunk);
			markOutput(chunk);
		});
		child.on("close", (code) => {
			finish("closed", code);
		});
	});
	const elapsedMs = Math.round(performance.now() - start);
	const relativeLogFile = relative(packageRoot, logFile);
	const record: RunRecord = {
		backends: runBackends,
		completionReason,
		elapsedMs,
		engine,
		exitCode,
		featureCounts: runFeatureCounts,
		logFile: relativeLogFile,
		runIndex,
		scenario,
		startedAt,
		workload,
	};
	const rows = parseRows(output, record, elapsedMs);

	await appendFile(runsJsonlFile, `${JSON.stringify(record)}\n`);
	await appendFile(
		rowsJsonlFile,
		rows.map((row) => JSON.stringify(row)).join("\n") +
			(rows.length > 0 ? "\n" : ""),
	);
	await appendFile(rowsCsvFile, rows.map(rowToCsv).join("\n") + "\n");

	return {record, rows};
}

async function main(): Promise<void> {
	await mkdir(rawDir, {recursive: true});
	await writeFile(
		rowsCsvFile,
		`${toCsvRow([
			"runIndex",
			"engine",
			"scenario",
			"workload",
			"viewport",
			"featureCount",
			"backend",
			"initialRenderMs",
			"updateRenderMs",
			"frameP95Ms",
			"memoryPeakMb",
			"vscL1Hits",
			"vscL1Misses",
			"vscTotalMs",
			"runElapsedMs",
			"sourceLog",
		])}\n`,
	);
	await writeFile(rowsJsonlFile, "");
	await writeFile(runsJsonlFile, "");
	await writeFile(
		manifestFile,
		`${JSON.stringify(
			{
				benchRenderBackends:
					process.env.BENCH_RENDER_BACKENDS ??
					"vsc-canvas,ol-canvas-flat,ol-webgl-flat",
				benchRenderCloseTimeoutMs:
					process.env.BENCH_RENDER_CLOSE_TIMEOUT_MS ?? "5000",
				benchRenderFeatures:
					process.env.BENCH_RENDER_FEATURES ?? "1000,10000",
				benchRenderHeadless: process.env.BENCH_RENDER_HEADLESS ?? "0",
				benchRenderUpdates: process.env.BENCH_RENDER_UPDATES ?? "4",
				benchRenderViewport: viewport,
				benchRenderWorkloads:
					process.env.BENCH_RENDER_WORKLOADS ?? "mutate",
				backends,
				completedOutputGraceMs,
				engines,
				featureCounts,
				outputDir: relative(packageRoot, outputDir),
				packageRoot: basename(packageRoot),
				sampleRuns,
				scenarios,
				splitTimeoutMs,
				startedAt: new Date().toISOString(),
				workloads,
			},
			null,
			2,
		)}\n`,
	);

	const allRows: BenchRow[] = [];
	let runIndex = 1;

	for (let sampleIndex = 1; sampleIndex <= sampleRuns; sampleIndex += 1) {
		for (const engine of engines) {
			for (const scenario of scenarios) {
				for (const workload of workloads) {
					console.log(
						[
							`\n[render-bench] sample ${sampleIndex}/${sampleRuns}`,
							engine,
							scenario,
							workload,
							`features=${featureCounts.join(",")}`,
							`backends=${backends.join(",")}`,
						].join(", "),
					);

					const {record, rows} = await runBenchmark(
						runIndex,
						engine,
						scenario,
						workload,
						featureCounts,
						backends,
					);
					allRows.push(...rows);
					await writeSummary(allRows);

					if (record.exitCode !== 0) {
						console.error(
							`[render-bench] ${engine}/${scenario}/${workload} exited with ${record.exitCode}; continuing`,
						);
					}

					runIndex += 1;
				}
			}
		}
	}

	console.log("\n[render-bench] complete");
	console.log(`[render-bench] output: ${relative(process.cwd(), outputDir)}`);
	console.log(`[render-bench] rows: ${relative(process.cwd(), rowsCsvFile)}`);
	console.log(
		`[render-bench] summary: ${relative(process.cwd(), summaryCsvFile)}`,
	);
}

await main();
