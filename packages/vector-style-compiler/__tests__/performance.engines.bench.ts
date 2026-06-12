import {execFile as execFileCallback} from "node:child_process";
import {PerformanceObserver, performance} from "node:perf_hooks";
import {pathToFileURL} from "node:url";
import {promisify} from "node:util";

import pidtree from "pidtree";
import pidusage from "pidusage";
// eslint-disable-next-line import-x/default
import playwright from "playwright";
import type {Page} from "playwright";

const execFile = promisify(execFileCallback);

type HashStrategy = "jsonStringify";

type EngineResult = {
	engine: string;
	strategy: HashStrategy;
	durationMs: number;
	rounds?: number;
	memoryBeforeBytes?: number | null;
	memoryAfterBytes?: number | null;
	memoryPeakBytes?: number | null;
	gcRuns?: number | null;
	gcDurationMs?: number | null;
};

type NodeGcStats = {
	runs: number;
	durationMs: number;
};

type BrowserWorkloadResult = {
	durationMs: number;
	hashMs: number;
	memoryBeforeBytes: number | null;
	memoryAfterBytes: number | null;
	memoryPeakBytes: number | null;
};

type FeatureRecord = {
	id: number;
	styleVariant: string;
	geometryType: "Point" | "LineString" | "Polygon";
	props: {
		los: number;
		trafficSituation: "Frei" | "Zaehfliessend" | "Stau" | "Unbekannt";
		labelEnabled: boolean;
		valueRange: number;
		state: "default" | "highlight" | "select";
	};
};

const WORKLOAD_TICKS = Number(process.env.BENCH_WORKLOAD_TICKS || 300);
const WORKLOAD_ROUNDS = Number(process.env.BENCH_WORKLOAD_ROUNDS || 10);
const PROCESS_SAMPLE_INTERVAL_MS = Number(
	process.env.BENCH_PROCESS_SAMPLE_INTERVAL_MS || 25,
);
const PROCESS_SETTLE_MS = Number(process.env.BENCH_PROCESS_SETTLE_MS || 100);
const DEBUG_PIDS = process.env.BENCH_DEBUG_PIDS === "1";
const DELIMITER = "|";

const STYLE_VARIANTS = Array.from({length: 30}, (_, i) => `variant-${i}`);

function formatBytes(bytes?: number | null): string {
	if (bytes == null || !Number.isFinite(bytes)) {
		return "n/a";
	}

	return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function createGcObserver(): {
	stats: NodeGcStats;
	disconnect: () => void;
} {
	const stats: NodeGcStats = {runs: 0, durationMs: 0};

	const observer = new PerformanceObserver((list) => {
		for (const entry of list.getEntries()) {
			stats.runs += 1;
			stats.durationMs += entry.duration;
		}
	});

	observer.observe({entryTypes: ["gc"]});

	return {
		stats,
		disconnect: () => observer.disconnect(),
	};
}

function forceGcIfAvailable(): void {
	const withGc = globalThis as typeof globalThis & {
		gc?: () => void;
	};

	if (typeof withGc.gc === "function") {
		withGc.gc();
	}
}

function toPid(pidValue: unknown): number | null {
	if (typeof pidValue !== "number" || !Number.isFinite(pidValue)) {
		return null;
	}

	const normalized = Math.trunc(pidValue);

	return normalized > 0 ? normalized : null;
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
		pids.map(async (pid) => {
			const rssBytes = await readProcessRssBytes(pid);
			return rssBytes;
		}),
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
	if (!DEBUG_PIDS) {
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

		const rows = stdout
			.trim()
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);

		for (const row of rows) {
			console.log(`[pid-debug] ${row}`);
		}
	} catch (error) {
		console.log(
			`[pid-debug] unable to inspect process names: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

function createBrowserWorkloadScript(strategy: HashStrategy): string {
	return `
(() => {
	const TOTAL_FEATURES = 1_000;
	const BASE_ACTIVE_FEATURES = 100;
	const FULL_BURST_EVERY_N_TICKS = 12;
	const TICKS = Number("${WORKLOAD_TICKS}");
	const ROUNDS = Number("${WORKLOAD_ROUNDS}");
	const STYLE_VARIANTS = Array.from({length: 30}, (_, i) => "variant-" + i);
	const DELIMITER = "${DELIMITER}";
	const STRATEGY = "${strategy}";

	function createSeededRandom(seed) {
		let state = seed >>> 0;
		return () => {
			state = (1664525 * state + 1013904223) >>> 0;
			return state / 0x100000000;
		};
	}

	function pickOne(items, random) {
		return items[Math.floor(random() * items.length)];
	}

	function createFeature(id, random) {
		const geometryType =
			id % 5 === 0
				? "Point"
				: id % 3 === 0
					? "Polygon"
					: "LineString";

		return {
			id,
			geometryType,
			props: {
				state: random() > 0.8 ? "highlight" : "default",
				trafficSituation: random() > 0.85 ? "Stau" : "None",
				los: Math.floor(random() * 5),
				labelEnabled: random() > 0.5,
				valueRange: Math.floor(random() * 100),
				name: "feature-" + id,
				variant: pickOne(STYLE_VARIANTS, random),
			},
		};
	}

	function createDeclarationHash(env, feature, envHash, hashFn) {
		const parts = [envHash, feature.geometryType, feature.props.variant];

		if (env.zoom >= 8) {
			parts.push(hashFn({
				los: feature.props.los,
				state: feature.props.state,
			}));
		}
		if (env.zoom >= 10 && feature.props.labelEnabled) {
			parts.push(hashFn({
				labelEnabled: true,
				name: feature.props.name,
			}));
		}
		if (env.zoom >= 12 || feature.props.trafficSituation === "Stau") {
			parts.push(hashFn({
				trafficSituation: feature.props.trafficSituation,
				valueRange: feature.props.valueRange,
			}));
		}

		return parts.join(DELIMITER);
	}

	function evaluateDeclarations(env, feature) {
		let declarationCount = 6;
		if (env.zoom >= 8) declarationCount += 4;
		if (env.zoom >= 10 && feature.props.state === "highlight") {
			declarationCount += 3;
		}
		if (
			feature.props.trafficSituation === "Stau" ||
			feature.props.los >= 3
		) {
			declarationCount += 2;
		}
		if (feature.props.labelEnabled && env.zoom >= 11) {
			declarationCount += 1;
		}
		if (feature.props.valueRange >= 70) {
			declarationCount += 1;
		}

		return declarationCount;
	}

	const random = createSeededRandom(20260509);
	const hashFn = JSON.stringify;
	const features = Array.from(
		{length: TOTAL_FEATURES},
		(_, i) => createFeature(i, random),
	);

	const cacheL1 = new Map();
	const cacheL2 = new Map();
	let hashMs = 0;
	let stylesReturned = 0;
	const startedAt = performance.now();

	for (let round = 0; round < ROUNDS; round++) {
		for (let tick = 0; tick < TICKS; tick++) {
			const activeCount =
				tick > 0 && tick % FULL_BURST_EVERY_N_TICKS === 0
					? TOTAL_FEATURES
					: BASE_ACTIVE_FEATURES;

			const env = {
				zoom: 7 + (tick % 12),
				style: tick % 9 === 0 ? "highlight" : "default",
				timeSlice: tick % 8,
			};

			for (let i = 0; i < activeCount; i++) {
				const feature = features[(i + tick * 7) % features.length];

				if ((tick + i) % 23 === 0) {
					feature.props.valueRange =
						(feature.props.valueRange + 17) % 100;
					feature.props.labelEnabled = !feature.props.labelEnabled;
				}
				if ((tick + i) % 31 === 0) {
					feature.props.state =
						feature.props.state === "default"
							? "highlight"
							: "default";
				}

				const hashStart = performance.now();
				const envHash = hashFn(env);
				const propsHash = hashFn(feature.props);
				hashMs += performance.now() - hashStart;

				const l1Key =
					envHash +
					DELIMITER +
					feature.geometryType +
					DELIMITER +
					propsHash;

				let l2Key = cacheL1.get(l1Key);
				if (!l2Key) {
					l2Key = createDeclarationHash(
						env,
						feature,
						envHash,
						hashFn,
					);
					cacheL1.set(l1Key, l2Key);
				}

				let styleCount = cacheL2.get(l2Key);
				if (styleCount == null) {
					styleCount = evaluateDeclarations(env, feature);
					cacheL2.set(l2Key, styleCount);
				}

				stylesReturned += styleCount;
			}

			if (tick % 10 === 0) cacheL1.clear();
			if (tick % 25 === 0) cacheL2.clear();
		}
	}

	const durationMs = performance.now() - startedAt;

	return {
		durationMs,
		hashMs,
		stylesReturned,
	};
})();
`;
}

async function runBrowserWorkloadWithOsMemory(
	page: Page,
	browserPid: number | null,
	strategy: HashStrategy,
): Promise<BrowserWorkloadResult> {
	await page.evaluate(() => 1);
	await page.waitForTimeout(PROCESS_SETTLE_MS);

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

	let benchmarkResult: {durationMs: number; hashMs: number};

	try {
		benchmarkResult = await page.evaluate(
			createBrowserWorkloadScript(strategy),
		);
	} finally {
		polling = false;
		clearInterval(pollInterval);
	}

	await page.waitForTimeout(PROCESS_SETTLE_MS);

	const memoryAfterBytes = await readProcessTreeRssBytes(browserPid);

	if (memoryAfterBytes != null) {
		memoryPeakBytes =
			memoryPeakBytes == null
				? memoryAfterBytes
				: Math.max(memoryPeakBytes, memoryAfterBytes);
	}

	return {
		durationMs: benchmarkResult.durationMs,
		hashMs: benchmarkResult.hashMs,
		memoryBeforeBytes,
		memoryAfterBytes,
		memoryPeakBytes,
	};
}

function runNodeWorkloadBenchmark(results: EngineResult[]): void {
	const random = createSeededRandom(20260509);
	const features = Array.from({length: 1_000}, (_, i) =>
		createFeature(i, random),
	);

	const runWorkload = (_strategy: HashStrategy) => {
		const hashFn = (value: unknown) => JSON.stringify(value);

		const cacheL1 = new Map<string, string>();
		const cacheL2 = new Map<string, number>();
		let hashMs = 0;
		let stylesReturned = 0;

		const gcObserver = createGcObserver();
		forceGcIfAvailable();

		const memoryBeforeBytes = process.memoryUsage().heapUsed;
		let memoryPeakBytes = memoryBeforeBytes;

		const startedAt = performance.now();

		for (let round = 0; round < WORKLOAD_ROUNDS; round++) {
			for (let tick = 0; tick < WORKLOAD_TICKS; tick++) {
				const activeCount = tick > 0 && tick % 12 === 0 ? 1_000 : 100;

				const env = {
					zoom: 7 + (tick % 12),
					style: tick % 9 === 0 ? "highlight" : "default",
					timeSlice: tick % 8,
				};

				for (let i = 0; i < activeCount; i++) {
					const feature = features[(i + tick * 7) % features.length]!;

					if ((tick + i) % 23 === 0) {
						feature.props.valueRange =
							(feature.props.valueRange + 17) % 100;
						feature.props.labelEnabled =
							!feature.props.labelEnabled;
					}
					if ((tick + i) % 31 === 0) {
						feature.props.state =
							feature.props.state === "default"
								? "highlight"
								: "default";
					}

					const hashStart = performance.now();
					const envHash = hashFn(env);
					const propsHash = hashFn(feature.props);
					hashMs += performance.now() - hashStart;

					const l1Key =
						`${envHash}${DELIMITER}${feature.geometryType}` +
						`${DELIMITER}${propsHash}`;

					let l2Key = cacheL1.get(l1Key);

					if (!l2Key) {
						l2Key = createDeclarationHash(
							env,
							feature,
							envHash,
							hashFn,
						);
						cacheL1.set(l1Key, l2Key);
					}

					let styleCount = cacheL2.get(l2Key);

					if (styleCount == null) {
						styleCount = evaluateDeclarations(env, feature);
						cacheL2.set(l2Key, styleCount);
					}

					stylesReturned += styleCount;
				}

				if (tick % 10 === 0) {
					cacheL1.clear();
				}
				if (tick % 25 === 0) {
					cacheL2.clear();
				}

				const heapNow = process.memoryUsage().heapUsed;
				memoryPeakBytes = Math.max(memoryPeakBytes, heapNow);
			}
		}

		const durationMs = performance.now() - startedAt;

		forceGcIfAvailable();

		const memoryAfterBytes = process.memoryUsage().heapUsed;
		gcObserver.disconnect();

		return {
			durationMs,
			hashMs,
			stylesReturned,
			memoryBeforeBytes,
			memoryAfterBytes,
			memoryPeakBytes,
			gcRuns: gcObserver.stats.runs,
			gcDurationMs: gcObserver.stats.durationMs,
		};
	};

	const json = runWorkload("jsonStringify");

	results.push({
		engine: "nodejs",
		strategy: "jsonStringify",
		durationMs: json.durationMs,
		rounds: WORKLOAD_ROUNDS,
		memoryBeforeBytes: json.memoryBeforeBytes,
		memoryAfterBytes: json.memoryAfterBytes,
		memoryPeakBytes: json.memoryPeakBytes,
		gcRuns: json.gcRuns,
		gcDurationMs: json.gcDurationMs,
	});
}

function createSeededRandom(seed: number): () => number {
	let state = seed >>> 0;

	return () => {
		state = (1664525 * state + 1013904223) >>> 0;
		return state / 0x100000000;
	};
}

function pickOne<T>(items: Array<T>, random: () => number): T {
	return items[Math.floor(random() * items.length)]!;
}

function createFeature(id: number, random: () => number): FeatureRecord {
	return {
		id,
		styleVariant: STYLE_VARIANTS[id % STYLE_VARIANTS.length]!,
		geometryType: pickOne(["Point", "LineString", "Polygon"], random),
		props: {
			los: Math.floor(random() * 5),
			trafficSituation: pickOne(
				["Frei", "Zaehfliessend", "Stau", "Unbekannt"],
				random,
			),
			labelEnabled: random() > 0.4,
			valueRange: Math.floor(random() * 100),
			state: pickOne(["default", "highlight", "select"], random),
		},
	};
}

function createDeclarationHash(
	env: Record<string, unknown>,
	feature: FeatureRecord,
	envHash: string,
	hashFn: (value: unknown) => string,
): string {
	let hash =
		envHash +
		DELIMITER +
		feature.geometryType +
		DELIMITER +
		feature.styleVariant;

	if (feature.props.los >= 2) {
		hash += `${DELIMITER}los:${feature.props.los}`;
	}
	if (feature.props.state !== "default") {
		hash += `${DELIMITER}state:${feature.props.state}`;
	}
	if (feature.props.valueRange >= 60) {
		hash += `${DELIMITER}range:${Math.floor(feature.props.valueRange / 10)}`;
	}
	if (feature.props.labelEnabled) {
		hash += `${DELIMITER}label:${hashFn(feature.props.labelEnabled)}`;
	}
	if ((env.zoom as number) >= 12) {
		hash += `${DELIMITER}zoomHi`;
	}

	return hash;
}

function evaluateDeclarations(
	env: Record<string, unknown>,
	feature: FeatureRecord,
): number {
	let declarationCount = 1;

	if ((env.zoom as number) < 9) {
		declarationCount += 1;
	}
	if (feature.props.trafficSituation === "Stau" || feature.props.los >= 3) {
		declarationCount += 2;
	}
	if (feature.props.labelEnabled && (env.zoom as number) >= 11) {
		declarationCount += 1;
	}
	if (feature.props.valueRange >= 70) {
		declarationCount += 1;
	}

	return declarationCount;
}

async function runBrowserStrategyBenchmark(
	engine: string,
	launcher: playwright.BrowserType,
	strategy: HashStrategy,
): Promise<EngineResult> {
	const browserServer = await launcher.launchServer({headless: true});
	const browserPid = toPid(browserServer.process()?.pid);
	const browser = await launcher.connect(browserServer.wsEndpoint());

	try {
		const context = await browser.newContext();

		try {
			const page = await context.newPage();

			await debugProcessTree(browserPid, `${engine}/${strategy} before`);

			const workloadResult = await runBrowserWorkloadWithOsMemory(
				page,
				browserPid,
				strategy,
			);

			await debugProcessTree(browserPid, `${engine}/${strategy} after`);

			return {
				engine,
				strategy,
				durationMs: workloadResult.durationMs,
				rounds: WORKLOAD_ROUNDS,
				memoryBeforeBytes: workloadResult.memoryBeforeBytes,
				memoryAfterBytes: workloadResult.memoryAfterBytes,
				memoryPeakBytes: workloadResult.memoryPeakBytes,
			};
		} finally {
			await context.close().catch(() => undefined);
		}
	} finally {
		await browser.close().catch(() => undefined);
		await browserServer.close().catch(() => undefined);
	}
}

async function run(): Promise<void> {
	const engines = [
		{engine: "chromium", launcher: playwright.chromium},
		{engine: "firefox", launcher: playwright.firefox},
		{engine: "webkit", launcher: playwright.webkit},
	] as const;

	const results: EngineResult[] = [];
	runNodeWorkloadBenchmark(results);

	for (const {engine, launcher} of engines) {
		for (const strategy of ["jsonStringify"] as const) {
			const result = await runBrowserStrategyBenchmark(
				engine,
				launcher,
				strategy,
			);

			results.push(result);
		}
	}

	console.log(
		`\nEngine benchmark — workload simulation ` +
			`(lower is better, rounds=${WORKLOAD_ROUNDS}, ticks=${WORKLOAD_TICKS}):\n`,
	);

	for (const engine of ["nodejs", "chromium", "firefox", "webkit"]) {
		const json = results.find(
			(result) =>
				result.engine === engine && result.strategy === "jsonStringify",
		);

		if (!json) {
			continue;
		}

		console.log(
			`${engine.padEnd(10)} ` +
				`JSON.stringify=${json.durationMs.toFixed(2)}ms`,
		);

		console.log(
			`${"".padEnd(10)} memory ` +
				`JSON(before=${formatBytes(json.memoryBeforeBytes)}, ` +
				`peak=${formatBytes(json.memoryPeakBytes)}, ` +
				`after=${formatBytes(json.memoryAfterBytes)})`,
		);

		if (engine === "nodejs") {
			console.log(
				`${"".padEnd(10)} GC ` +
					`JSON(runs=${json.gcRuns ?? "n/a"}, ` +
					`total=${json.gcDurationMs?.toFixed(2) ?? "n/a"}ms) `,
			);
		}
	}

	console.log("\nNotes:");
	console.log(
		"- Browser memory metrics come from OS RSS summed across the full " +
			"Playwright browser process tree (`pidtree` + `pidusage`).",
	);
	console.log(
		"- This is especially important for Playwright WebKit, where the root " +
			"PID is often only a tiny launcher process.",
	);
	console.log(
		"- RSS is a process-level metric, not a JS-heap-only metric, and can " +
			"overcount shared pages across processes.",
	);
	console.log(
		"- Browser strategies are isolated by launching a fresh browser " +
			"instance per strategy.",
	);
	console.log(
		"- Node forced GC requires `node --expose-gc`; otherwise GC still runs " +
			"naturally but cannot be forced.",
	);
	console.log(
		`- Process sampling interval: ${PROCESS_SAMPLE_INTERVAL_MS}ms; ` +
			`settle delay: ${PROCESS_SETTLE_MS}ms.`,
	);
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;

if (entryUrl != null && import.meta.url === entryUrl) {
	run().catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
}
