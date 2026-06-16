#!/usr/bin/env node
import {createHash, randomUUID} from "node:crypto";
import {
	glob,
	mkdir,
	readFile,
	rename,
	stat,
	unlink,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {parseArgs} from "node:util";

import sharp, {type Sharp} from "sharp";
import {type Config, optimize as optimizeSvg} from "svgo";
import {z} from "zod/v4";

type ResultStatus = "processed" | "skipped" | "failed";
type SourceKind = "svg" | "png";
type TargetFormat = "svg" | "png" | "webp";

const ManifestEntrySchema = z.object({
	srcMtimeMs: z.number(),
	srcSize: z.number(),
	outputs: z.array(z.string()),
});

type ManifestEntry = z.infer<typeof ManifestEntrySchema>;

const ManifestSchema = z.object({
	version: z.number(),
	configHash: z.string(),
	files: z.record(z.string(), ManifestEntrySchema),
});

type Manifest = z.infer<typeof ManifestSchema>;

interface FileJob {
	absSource: string;
	relSource: string;
	kind: SourceKind;
	outputs: string[];
	absOutSvg?: string;
	absOutPng?: string;
	absOutWebp?: string;
}

interface ProcessResult {
	source: string;
	status: ResultStatus;
	error?: unknown;
}

const CACHE_VERSION = 2;
const DEFAULT_CONCURRENCY = 4;
const createdDirs = new Set<string>();

const PNG_OPTIONS = {
	palette: true,
	compressionLevel: 9,
	effort: 8,
} as const;

const WEBP_OPTIONS = {
	lossless: true,
	effort: 6,
} as const;

const scriptName = path.basename(process.argv[1] ?? "optimize-icons.ts");

async function main() {
	const {values: cliArgs} = parseArgs({
		args: process.argv.slice(2),
		options: {
			src: {type: "string", short: "s"},
			dest: {type: "string", short: "d"},
			scale: {type: "string", default: "1"},
			concurrency: {
				type: "string",
				short: "c",
				default: String(DEFAULT_CONCURRENCY),
			},
			target: {type: "string", short: "t", default: "svg,png,webp"},
			force: {type: "boolean", default: false},
			verbose: {type: "boolean", default: false},
			pretty: {type: "boolean", default: false},
		},
	});
	const srcArg = cliArgs.src;
	const destArg = cliArgs.dest;
	const scaleArg = cliArgs.scale;
	const concurrencyArg = cliArgs.concurrency;
	const targetArg = cliArgs.target;
	const force = cliArgs.force;
	const verbose = cliArgs.verbose;
	const pretty = cliArgs.pretty ?? false;

	if (typeof srcArg !== "string" || typeof destArg !== "string") {
		fail(
			`Usage: node ${scriptName} --src <dir> --dest <dir> ` +
				`[--scale <number>] [--concurrency <number>] [--target <formats>] [--force] [--pretty]`,
		);
	}

	const targets = new Set(
		(targetArg ?? "svg,png,webp")
			.split(",")
			.map((s) => s.trim().toLowerCase()) as TargetFormat[],
	);

	for (const t of targets) {
		if (t !== "svg" && t !== "png" && t !== "webp") {
			fail(
				`Invalid target format: ${t as string}. Must be svg, png, or webp.`,
			);
		}
	}

	const scale = Number(scaleArg ?? "1");
	if (!Number.isFinite(scale) || scale <= 0) {
		fail("--scale must be a positive finite number.");
	}

	const concurrency = Number(concurrencyArg ?? String(DEFAULT_CONCURRENCY));
	if (
		!Number.isFinite(concurrency) ||
		!Number.isInteger(concurrency) ||
		concurrency <= 0
	) {
		fail("--concurrency must be a positive integer.");
	}

	const absSrc = path.resolve(srcArg);
	const absDest = path.resolve(destArg);

	const scriptPath = fileURLToPath(import.meta.url);
	const packageRoot = path.resolve(path.dirname(scriptPath), "..");
	const manifestDir = path.join(packageRoot, "tmp");
	const manifestHash = createHash("sha256")
		.update(`${absSrc}:${absDest}`)
		.digest("hex")
		.slice(0, 16);
	const absManifestPath = path.join(
		manifestDir,
		`optimize-icons-manifest-${manifestHash}.json`,
	);

	if (pathsOverlap(absSrc, absDest)) {
		fail("--src and --dest must not overlap.");
	}

	const svgoOptions = createSvgoOptions(pretty);
	const configHash = hashConfig({
		cacheVersion: CACHE_VERSION,
		scale,
		png: PNG_OPTIONS,
		webp: WEBP_OPTIONS,
		svgo: svgoOptions,
	});

	if (verbose) {
		console.log(`Starting optimization with scale ${scale}`);
	}

	await ensureDir(absDest);

	const previousManifest = await loadManifest(absManifestPath);
	const cacheUsable =
		!force &&
		previousManifest.version === CACHE_VERSION &&
		previousManifest.configHash === configHash;

	const jobs = await discoverJobs(absSrc, absDest, targets);

	if (verbose) {
		console.log(`Found ${jobs.length} source images.`);
		if (force) {
			console.log("Force rebuild enabled.");
		} else if (!cacheUsable) {
			console.log(
				"Manifest/config changed; rebuilding all current sources.",
			);
		}
	}

	const nextManifest: Manifest = {
		version: CACHE_VERSION,
		configHash,
		files: {},
	};

	const currentSourceSet = new Set(jobs.map((job) => job.relSource));

	const results = await runWithConcurrency(jobs, concurrency, (job) =>
		processJob({
			job,
			previousManifest,
			nextManifest,
			cacheUsable,
			force: force ?? false,
			scale,
			verbose: verbose ?? false,
			absDest,
			svgoOptions,
		}),
	);

	await cleanupRemovedSourceOutputs({
		previousManifest,
		currentSourceSet,
		absDest,
	});

	await atomicWriteText(
		absManifestPath,
		JSON.stringify(nextManifest, null, 2) + "\n",
	);

	let processed = 0;
	let skipped = 0;
	let failed = 0;

	for (const result of results) {
		if (result.status === "processed") processed++;
		if (result.status === "skipped") skipped++;
		if (result.status === "failed") failed++;
	}

	if (verbose) {
		console.log("");
		console.log(
			`Done. Processed: ${processed} | Skipped: ${skipped} | Failed: ${failed}`,
		);
	}

	if (failed > 0) {
		process.exitCode = 1;
	}
}

async function discoverJobs(
	srcDir: string,
	destDir: string,
	targets: Set<TargetFormat>,
): Promise<FileJob[]> {
	const jobs: FileJob[] = [];
	const outputOwners = new Map<string, string>();

	for await (const relGlobPath of glob("**/*", {cwd: srcDir})) {
		const relPath = toPosixPath(relGlobPath);
		const parsed = path.posix.parse(relPath);
		const ext = parsed.ext.toLowerCase();

		if (ext !== ".svg" && ext !== ".png") {
			continue;
		}

		const kind: SourceKind = ext === ".svg" ? "svg" : "png";
		const relBase = path.posix.join(parsed.dir, parsed.name);

		const outputs: string[] = [];
		let absOutSvg: string | undefined;
		let absOutPng: string | undefined;
		let absOutWebp: string | undefined;

		if (targets.has("svg") && kind === "svg") {
			const relOutSvg = `${relBase}.svg`;
			outputs.push(relOutSvg);
			absOutSvg = path.join(destDir, relOutSvg);
		}

		if (targets.has("png")) {
			const relOutPng = `${relBase}.png`;
			outputs.push(relOutPng);
			absOutPng = path.join(destDir, relOutPng);
		}

		if (targets.has("webp")) {
			const relOutWebp = `${relBase}.webp`;
			outputs.push(relOutWebp);
			absOutWebp = path.join(destDir, relOutWebp);
		}

		const absSource = path.join(srcDir, relPath);

		if (outputs.length === 0) {
			continue;
		}

		const outputCollisionKey = relBase;
		const existingOwner = outputOwners.get(outputCollisionKey);

		if (existingOwner) {
			throw new Error(
				[
					"Output collision detected.",
					`Both "${existingOwner}" and "${relPath}" map to the same output base "${relBase}".`,
					"Rename one of the source files or change the output naming strategy.",
				].join(" "),
			);
		}

		outputOwners.set(outputCollisionKey, relPath);

		jobs.push({
			absSource,
			relSource: relPath,
			kind,
			outputs,
			absOutSvg,
			absOutPng,
			absOutWebp,
		});
	}

	jobs.sort((a, b) => a.relSource.localeCompare(b.relSource));
	return jobs;
}

interface ProcessJobArgs {
	job: FileJob;
	previousManifest: Manifest;
	nextManifest: Manifest;
	cacheUsable: boolean;
	force: boolean;
	scale: number;
	verbose: boolean;
	absDest: string;
	svgoOptions: Config;
}

async function processJob(args: ProcessJobArgs): Promise<ProcessResult> {
	const {
		job,
		previousManifest,
		nextManifest,
		cacheUsable,
		force,
		scale,
		verbose,
		absDest,
		svgoOptions,
	} = args;

	try {
		const srcStat = await stat(job.absSource);
		if (job.kind === "svg") {
			await validateSvgSource(job.absSource);
		}

		const nextEntry: ManifestEntry = {
			srcMtimeMs: srcStat.mtimeMs,
			srcSize: srcStat.size,
			outputs: job.outputs,
		};

		const previousEntry = previousManifest.files[job.relSource]!;
		const shouldProcess = await needsProcessing({
			previousEntry,
			nextEntry,
			cacheUsable,
			force,
			absDest,
		});

		if (!shouldProcess) {
			nextManifest.files[job.relSource] = previousEntry;
			return {source: job.relSource, status: "skipped"};
		}

		if (verbose) {
			console.log(`Processing: ${job.relSource}`);
		}

		if (job.kind === "svg") {
			await processSvgJob(job, scale, svgoOptions);
		} else {
			await processPngJob(job, scale);
		}

		nextManifest.files[job.relSource] = nextEntry;
		return {source: job.relSource, status: "processed"};
	} catch (error) {
		console.error(`Error processing ${job.relSource}:`, error);
		return {source: job.relSource, status: "failed", error};
	}
}

async function needsProcessing(args: {
	previousEntry?: ManifestEntry;
	nextEntry: ManifestEntry;
	cacheUsable: boolean;
	force: boolean;
	absDest: string;
}): Promise<boolean> {
	const {previousEntry, nextEntry, cacheUsable, force, absDest} = args;

	if (force) return true;
	if (!cacheUsable) return true;
	if (!previousEntry) return true;

	if (previousEntry.srcMtimeMs !== nextEntry.srcMtimeMs) return true;
	if (previousEntry.srcSize !== nextEntry.srcSize) return true;

	if (!sameStringArray(previousEntry.outputs, nextEntry.outputs)) {
		return true;
	}

	for (const relOutput of nextEntry.outputs) {
		const absOutput = path.join(absDest, relOutput);

		try {
			await stat(absOutput);
		} catch {
			return true;
		}
	}

	return false;
}

function createSvgoOptions(pretty: boolean): Config {
	const options: Config = {
		multipass: true,
		plugins: [
			"preset-default",
			"removeTitle",
			{name: "removeAttrs", params: {attrs: ["class", "id"]}},
		],
	};

	if (pretty) {
		options.js2svg = {
			pretty: true,
			indent: "\t",
			finalNewline: true,
		};
	}

	return options;
}

async function validateSvgSource(absSource: string) {
	const svgContent = await readFile(absSource, "utf8");

	if (/\b(?:xmlns:xlink|xlink:[\w-]+)\s*=/i.test(svgContent)) {
		throw new Error(
			"SVG uses xlink attributes. Inline the referenced shapes before optimizing.",
		);
	}

	if (/<style[\s>]/i.test(svgContent)) {
		throw new Error(
			"SVG contains a <style> element. Use presentation attributes instead.",
		);
	}
}

async function processSvgJob(job: FileJob, scale: number, svgoOptions: Config) {
	const svgContent = await readFile(job.absSource, "utf8");
	const optimized = optimizeSvg(svgContent, {
		path: job.absSource,
		...svgoOptions,
	});

	const optimizedSvg = optimized.data;
	const svgBuffer = Buffer.from(optimizedSvg);

	const promises: Promise<void>[] = [];

	if (job.absOutSvg) {
		promises.push(atomicWriteText(job.absOutSvg, optimizedSvg));
	}

	if (job.absOutPng || job.absOutWebp) {
		const metadata = await sharp(svgBuffer).metadata();
		const targetWidth = getScaledDimension(metadata.width, scale);

		promises.push(
			writeRasterVariants({
				input: sharp(
					svgBuffer,
					scale > 1 ? {density: Math.ceil(72 * scale)} : undefined,
				),
				outPng: job.absOutPng,
				outWebp: job.absOutWebp,
				targetWidth,
				scale,
			}),
		);
	}

	await Promise.all(promises);
}

async function processPngJob(job: FileJob, scale: number) {
	if (!job.absOutPng && !job.absOutWebp) {
		return;
	}

	const input = sharp(job.absSource);
	const metadata = await input.metadata();
	const targetWidth = getScaledDimension(metadata.width, scale);

	await writeRasterVariants({
		input,
		outPng: job.absOutPng,
		outWebp: job.absOutWebp,
		targetWidth,
		scale,
	});
}

async function writeRasterVariants(args: {
	input: Sharp;
	outPng?: string;
	outWebp?: string;
	targetWidth?: number;
	scale: number;
}) {
	const {input, outPng, outWebp, targetWidth} = args;

	let base = input.clone();

	if (targetWidth) {
		base = base.resize({width: targetWidth});
	}

	const promises: Promise<void>[] = [];

	if (outPng) {
		promises.push(atomicToFile(base.clone().png(PNG_OPTIONS), outPng));
	}

	if (outWebp) {
		promises.push(atomicToFile(base.clone().webp(WEBP_OPTIONS), outWebp));
	}

	await Promise.all(promises);
}

async function cleanupRemovedSourceOutputs(args: {
	previousManifest: Manifest;
	currentSourceSet: Set<string>;
	absDest: string;
}) {
	const {previousManifest, currentSourceSet, absDest} = args;

	for (const [relSource, entry] of Object.entries(previousManifest.files)) {
		if (currentSourceSet.has(relSource)) {
			continue;
		}

		for (const relOutput of entry.outputs) {
			const absOutput = path.join(absDest, relOutput);
			await safeUnlink(absOutput);
		}
	}
}

async function loadManifest(manifestPath: string): Promise<Manifest> {
	try {
		const raw = await readFile(manifestPath, "utf8");
		return ManifestSchema.parse(JSON.parse(raw));
	} catch {
		return emptyManifest();
	}
}

function emptyManifest(): Manifest {
	return {
		version: 0,
		configHash: "",
		files: {},
	};
}

async function atomicToFile(pipeline: Sharp, outPath: string) {
	await ensureDir(path.dirname(outPath));

	const tempPath = makeTempPath(outPath);

	try {
		await pipeline.toFile(tempPath);
		await rename(tempPath, outPath);
	} catch (error) {
		await safeUnlink(tempPath);
		throw error;
	}
}

async function atomicWriteText(outPath: string, content: string) {
	await ensureDir(path.dirname(outPath));

	const tempPath = makeTempPath(outPath);

	try {
		await writeFile(tempPath, content, "utf8");
		await rename(tempPath, outPath);
	} catch (error) {
		await safeUnlink(tempPath);
		throw error;
	}
}

async function ensureDir(dirPath: string) {
	const absDir = path.resolve(dirPath);

	if (createdDirs.has(absDir)) {
		return;
	}

	await mkdir(absDir, {recursive: true});
	createdDirs.add(absDir);
}

async function safeUnlink(filePath: string) {
	try {
		await unlink(filePath);
	} catch {
		// ignore missing files and cleanup failures
	}
}

function makeTempPath(finalPath: string) {
	return `${finalPath}.tmp-${process.pid}-${randomUUID()}`;
}

function hashConfig(value: unknown): string {
	return createHash("sha256")
		.update(JSON.stringify(value))
		.digest("hex")
		.slice(0, 16);
}

function getScaledDimension(
	original: number | undefined,
	scaleValue: number,
): number | undefined {
	if (!original || scaleValue === 1) {
		return undefined;
	}

	const scaled = Math.max(1, Math.round(original * scaleValue));

	if (scaled === original) {
		return undefined;
	}

	return scaled;
}

function sameStringArray(a: string[], b: string[]) {
	if (a.length !== b.length) return false;

	for (let i = 0; i < a.length; i += 1) {
		if (a[i] !== b[i]) return false;
	}

	return true;
}

function toPosixPath(filePath: string) {
	return filePath.split(path.sep).join(path.posix.sep);
}

function isSameOrSubpath(parent: string, child: string) {
	const rel = path.relative(parent, child);
	return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function pathsOverlap(a: string, b: string) {
	return isSameOrSubpath(a, b) || isSameOrSubpath(b, a);
}

async function runWithConcurrency<T, R>(
	items: T[],
	limit: number,
	worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const results = new Array<R>(items.length);
	let nextIndex = 0;

	async function runner() {
		while (true) {
			const currentIndex = nextIndex;
			nextIndex += 1;

			if (currentIndex >= items.length) {
				return;
			}

			results[currentIndex] = await worker(
				items[currentIndex]!,
				currentIndex,
			);
		}
	}

	const workerCount = Math.min(limit, items.length);
	await Promise.all(
		Array.from({length: workerCount}, async () => {
			await runner();
		}),
	);

	return results;
}

function fail(message: string): never {
	console.error(message);
	throw new Error(message);
}

export function runMain() {
	return main();
}

if (process.env.NODE_ENV !== "test") {
	runMain().catch((error) => {
		console.error("Fatal error:", error);
		throw error;
	});
}

export {main, discoverJobs, processJob, hashConfig, getScaledDimension};
