import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {createSecureServer} from "node:http2";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {parseArgs} from "node:util";
import {gzipSync} from "node:zlib";

import {chromium} from "@playwright/test";
import {build} from "vite";

import type {PreloadPlan} from "./icon-preload.ts";
import type {Input, Mode, Tile, run} from "./icon-rendering.ts";

const {values} = parseArgs({
	options: {
		out: {type: "string"},
		assets: {type: "string"},
		suite: {type: "string", default: "rendering"},
		repeats: {type: "string", default: "5"},
		frames: {type: "string"},
	},
});
const appRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const repoRoot = path.resolve(appRoot, "../..");
const trafficRoot = path.join(repoRoot, "packages/traffic-style");
const assetsRoot = path.resolve(
	values.assets ?? path.join(trafficRoot, "dist"),
);
const suite = values.suite;
assert(suite === "rendering" || suite === "preload");
const frames = Number(values.frames ?? (suite === "preload" ? "2" : "30"));
assert(Number.isInteger(frames) && frames > 0);
const repeats = Number(values.repeats);
assert(Number.isInteger(repeats) && repeats > 0);
const out = path.resolve(
	values.out ?? path.join(appRoot, "tmp/icon-rendering.json"),
);
const temp = await mkdtemp(path.join(os.tmpdir(), "mapsight-icons-"));
const result = await build({
	configFile: false,
	root: appRoot,
	logLevel: "error",
	build: {
		write: false,
		minify: true,
		lib: {
			entry: path.join(appRoot, "bench/icon-rendering.ts"),
			name: "IconBench",
			formats: ["iife"],
		},
	},
});
const output = Array.isArray(result) ? result[0] : result;
assert(output && "output" in output);
const bundle = output.output.find((chunk) => chunk.type === "chunk")!;
assert(bundle.type === "chunk");
const meta = JSON.parse(
	await readFile(path.join(trafficRoot, "src/meta.json"), "utf8"),
) as {icons: Record<string, {render: string; groups?: string[]}>};
const ids = Object.entries(meta.icons)
	.filter(
		([, icon]) =>
			icon.render === "sprite" &&
			icon.groups?.some(
				(group) => group === "traffic" || group === "poi-parking",
			),
	)
	.map(([id]) => id)
	.sort();
const scss = await readFile(
	path.join(assetsRoot, "mapsight-traffic-style-icon-sprite-2x.scss"),
	"utf8",
);
const tiles: Record<string, Tile> = {};
for (const id of ids) {
	const match = scss.match(
		new RegExp(
			`"${id}-default": \\(\\s*x: (\\d+),\\s*y: (\\d+),\\s*width: (\\d+),\\s*height: (\\d+)`,
		),
	);
	assert(match, `Missing sprite tile: ${id}`);
	tiles[id] = {
		x: Number(match[1]),
		y: Number(match[2]),
		width: Number(match[3]),
		height: Number(match[4]),
	};
}
const sprite = await readFile(
	path.join(assetsRoot, "img/mapsight-traffic-style-icon-sprite-2x.png"),
);
const pngs = new Map(
	await Promise.all(
		ids.map(
			async (id) =>
				[
					id,
					await readFile(
						path.join(
							assetsRoot,
							`img/mapsight-icons-2x/${id}-default.png`,
						),
					),
				] as const,
		),
	),
);
execFileSync(
	"openssl",
	[
		"req",
		"-x509",
		"-newkey",
		"rsa:2048",
		"-nodes",
		"-keyout",
		path.join(temp, "key.pem"),
		"-out",
		path.join(temp, "cert.pem"),
		"-days",
		"1",
		"-subj",
		"/CN=localhost",
	],
	{stdio: "ignore"},
);
const server = createSecureServer(
	{
		key: await readFile(path.join(temp, "key.pem")),
		cert: await readFile(path.join(temp, "cert.pem")),
	},
	(request, response) => {
		const url = request.url?.split("?")[0];
		let body: Buffer | string | undefined;
		let type: string;
		if (url === "/") {
			body =
				'<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}</style></head><body><script src="/bench.js"></script></body></html>';
			type = "text/html; charset=utf-8";
		} else if (url === "/bench.js") {
			body = bundle.code;
			type = "text/javascript; charset=utf-8";
		} else if (url === "/sprite.png") {
			body = sprite;
			type = "image/png";
		} else {
			const id = url?.match(/^\/png\/([a-z_-]+)\.png$/)?.[1];
			body = id ? pngs.get(id) : undefined;
			type = "image/png";
		}
		if (!body) {
			response.writeHead(404);
			response.end();
			return;
		}
		response.writeHead(200, {
			"content-type": type,
			"cache-control": "public, max-age=3600",
		});
		response.end(body);
	},
);
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
assert(address && typeof address !== "string");
const browser = await chromium.launch({headless: true});
const profiles = [
	{name: "desktop", cpu: 1, latency: 0, down: -1},
	{name: "mobile-simulated", cpu: 4, latency: 80, down: 1_600_000 / 8},
];
const cases = [
	{count: 1000, unique: 1},
	{count: 1000, unique: ids.length},
	...(suite === "rendering" ? [{count: 5000, unique: ids.length}] : []),
];
type Strategy = {name: string; mode: Mode; preload?: PreloadPlan};
const modes: Mode[] = ["sprite", "png", "svg", "runtime"];
const strategies: Strategy[] =
	suite === "rendering"
		? modes.map((mode) => ({name: mode, mode}))
		: [
				...(["sprite", "png", "runtime"] as const).map((mode) => ({
					name: `${mode}-demand`,
					mode,
				})),
				...(["sprite", "png"] as const).flatMap((mode) =>
					[100, 300].map((leadMs) => ({
						name: `${mode}-preload-${leadMs}`,
						mode,
						preload: {
							leadMs,
							concurrency: 2,
							maxTargets: 32,
							budgetMs: 250,
							forecast: "correct" as const,
							mapImage: true,
						},
					})),
				),
				...[0, 100, 300].map((leadMs) => ({
					name: `runtime-bitmap-2-${leadMs}`,
					mode: "runtime" as const,
					preload: {
						leadMs,
						concurrency: 2,
						maxTargets: 32,
						budgetMs: 250,
						forecast: "correct" as const,
						mapImage: false,
					},
				})),
				...[100, 300].map((leadMs) => ({
					name: `runtime-image-2-${leadMs}`,
					mode: "runtime" as const,
					preload: {
						leadMs,
						concurrency: 2,
						maxTargets: 32,
						budgetMs: 250,
						forecast: "correct" as const,
						mapImage: true,
					},
				})),
				{
					name: "runtime-bitmap-4-100",
					mode: "runtime",
					preload: {
						leadMs: 100,
						concurrency: 4,
						maxTargets: 32,
						budgetMs: 250,
						forecast: "correct",
						mapImage: false,
					},
				},
				{
					name: "runtime-wrong-300",
					mode: "runtime",
					preload: {
						leadMs: 300,
						concurrency: 2,
						maxTargets: 8,
						budgetMs: 250,
						forecast: "wrong",
						mapImage: true,
					},
				},
				{
					name: "runtime-abandon-100",
					mode: "runtime",
					preload: {
						leadMs: 100,
						concurrency: 2,
						maxTargets: 8,
						budgetMs: 250,
						forecast: "wrong",
						mapImage: true,
						cancelAfterMs: 25,
					},
				},
			];
type Result = Awaited<ReturnType<typeof run>>;
const samples: Array<
	Result & {
		profile: string;
		count: number;
		unique: number;
		mode: Mode;
		strategy: string;
		repeat: number;
		warm: boolean;
	}
> = [];
try {
	for (const profile of profiles)
		for (const scenario of cases)
			for (let repeat = 0; repeat < repeats; repeat++) {
				// Rotate order to avoid consistently giving one path the earliest/coldest run.
				const order = strategies.map(
					(_, index) =>
						strategies[(index + repeat) % strategies.length]!,
				);
				for (const strategy of order) {
					const {mode, preload} = strategy;
					const context = await browser.newContext({
						viewport: {width: 1280, height: 960},
						deviceScaleFactor: 2,
						ignoreHTTPSErrors: true,
					});
					try {
						const page = await context.newPage();
						page.on("pageerror", (error) =>
							console.error(error.message),
						);
						page.on("requestfailed", (request) =>
							console.error(request.url(), request.failure()),
						);
						await page.goto(`https://127.0.0.1:${address.port}`, {
							waitUntil: "load",
						});
						const cdp = await context.newCDPSession(page);
						await cdp.send("Emulation.setCPUThrottlingRate", {
							rate: profile.cpu,
						});
						await cdp.send("Network.enable");
						await cdp.send("Network.emulateNetworkConditions", {
							offline: false,
							latency: profile.latency,
							downloadThroughput: profile.down,
							uploadThroughput: profile.down,
						});
						for (const warm of suite === "preload"
							? [false]
							: [false, true]) {
							const input: Input = {
								mode,
								preload,
								ids: ids.slice(0, scenario.unique),
								tiles,
								count: scenario.count,
								warm,
								frames,
							};
							const sample = await page.evaluate(async (data) => {
								const bench = (
									window as unknown as {
										IconBench: {
											run: (
												input: Input,
											) => Promise<Result>;
										};
									}
								).IconBench;
								return bench.run(data);
							}, input);
							if (
								!warm &&
								(mode === "sprite" || mode === "png")
							) {
								assert.equal(
									sample.imageRequests,
									mode === "sprite" ? 1 : input.ids.length,
								);
								assert.deepEqual(sample.protocols, ["h2"]);
							}
							if (preload) {
								assert(sample.preloading);
								assert(
									sample.preloading.peakActive <=
										preload.concurrency,
								);
								assert(
									sample.preloading.started <=
										preload.maxTargets,
								);
							}
							samples.push({
								strategy: strategy.name,
								profile: profile.name,
								...scenario,
								mode,
								repeat,
								warm,
								...sample,
							});
						}
					} finally {
						await context.close();
					}
				}
				console.log(
					`${profile.name}: ${scenario.count} features / ${scenario.unique} ids, repeat ${repeat + 1}/${repeats}`,
				);
			}
	await mkdir(path.dirname(out), {recursive: true});
	await writeFile(
		out,
		JSON.stringify(
			{
				date: new Date().toISOString(),
				suite,
				strategies,
				chromium: browser.version(),
				viewport: [1280, 960],
				dpr: 2,
				cpus: os.cpus().length,
				cpu: os.cpus()[0]?.model,
				profiles,
				repeats,
				frames,
				bundleBytes: Buffer.byteLength(bundle.code),
				bundleGzipBytes: gzipSync(bundle.code).length,
				spriteBytes: sprite.length,
				pngBytes: Object.fromEntries(
					[...pngs].map(([id, png]) => [id, png.length]),
				),
				samples,
			},
			null,
			2,
		) + "\n",
	);
	console.log(`Saved ${samples.length} samples to ${out}`);
} finally {
	await browser.close();
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
	await rm(temp, {recursive: true, force: true});
}
