import {spawn} from "node:child_process";
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KEEP_TMP = process.env.KEEP_STARTER_COPY_OUT_TMP === "1";

const starters = [
	"mapsight-host-starter",
	"mapsight-next-starter",
	"mapsight-vite-spa-starter",
] as const;

const mapsightPackages = [
	"@mapsight/core",
	"@mapsight/lib-js",
	"@mapsight/lib-ol",
	"@mapsight/lib-redux",
	"@mapsight/traffic-style",
	"@mapsight/ui",
	"@mapsight/vector-style-compiler",
	"@mapsight/vite-host-embed",
] as const;

const packageFilters = new Map<(typeof mapsightPackages)[number], string>([
	["@mapsight/core", "@mapsight/core"],
	["@mapsight/lib-js", "@mapsight/lib-js"],
	["@mapsight/lib-ol", "@mapsight/lib-ol"],
	["@mapsight/lib-redux", "@mapsight/lib-redux"],
	["@mapsight/traffic-style", "@mapsight/traffic-style"],
	["@mapsight/ui", "@mapsight/ui"],
	["@mapsight/vector-style-compiler", "@mapsight/vector-style-compiler"],
	["@mapsight/vite-host-embed", "@mapsight/vite-host-embed"],
]);

type PackageJson = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	overrides?: Record<string, string>;
};

function mirrorPrefixed(
	stream: NodeJS.ReadableStream | null,
	prefix: string,
	write: (chunk: string) => void,
	onData?: (chunk: string) => void,
): Promise<void> {
	if (!stream) {
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		let pending = "";

		stream.on("data", (chunk: Buffer | string) => {
			const text =
				typeof chunk === "string" ? chunk : chunk.toString("utf8");
			onData?.(text);
			pending += text;

			while (true) {
				const newline = pending.indexOf("\n");
				if (newline === -1) {
					break;
				}

				const line = pending.slice(0, newline);
				pending = pending.slice(newline + 1);
				write(`${prefix}${line}\n`);
			}
		});
		stream.on("error", reject);
		stream.on("end", () => {
			if (pending.length > 0) {
				write(`${prefix}${pending}\n`);
			}
			resolve();
		});
	});
}

async function run(
	command: string,
	args: string[],
	cwd = ROOT,
	logPrefix = "",
): Promise<string> {
	const child = spawn(command, args, {
		cwd,
		stdio: ["ignore", "pipe", "pipe"],
	});
	let stdout = "";

	const stdoutDone = mirrorPrefixed(
		child.stdout,
		logPrefix,
		(chunk) => {
			process.stdout.write(chunk);
		},
		(chunk) => {
			stdout += chunk;
		},
	);
	const stderrDone = mirrorPrefixed(child.stderr, logPrefix, (chunk) => {
		process.stderr.write(chunk);
	});

	const [status] = await Promise.all([
		new Promise<number | null>((resolve, reject) => {
			child.on("error", reject);
			child.on("close", resolve);
		}),
		stdoutDone,
		stderrDone,
	]);

	if (status !== 0) {
		throw new Error(
			`Command failed (${status ?? "unknown"}): ${command} ${args.join(" ")}`,
		);
	}

	return stdout.trim();
}

async function settleAllOrThrow<T>(
	tasks: Array<Promise<T>>,
	label: string,
): Promise<T[]> {
	const results = await Promise.allSettled(tasks);
	const failures = results.flatMap((result, index) =>
		result.status === "rejected" ? [{index, reason: result.reason}] : [],
	);

	if (failures.length > 0) {
		for (const {index, reason} of failures) {
			console.error(`[copy-out] ${label} #${index} failed:`, reason);
		}
		throw new Error(`${label}: ${failures.length} task(s) failed`);
	}

	return results.map((result) => (result as PromiseFulfilledResult<T>).value);
}

async function packMapsightPackages(
	tarballDir: string,
): Promise<Map<string, string>> {
	// Pack sequentially: concurrent `pnpm pack` races on workspace protocol
	// resolution (e.g. traffic-style → lib-ol) and fails flakily in CI.
	const tarballs = new Map<string, string>();

	for (const packageName of mapsightPackages) {
		const filter = packageFilters.get(packageName)!;
		const output = await run("pnpm", [
			"--filter",
			filter,
			"pack",
			"--pack-destination",
			tarballDir,
		]);
		const tarballPath = output.split("\n").at(-1);

		if (!tarballPath) {
			throw new Error(
				`Could not determine tarball path for ${packageName}`,
			);
		}

		tarballs.set(packageName, tarballPath);
	}

	return tarballs;
}

function rewriteMapsightDeps(
	section: Record<string, string> | undefined,
	tarballs: Map<string, string>,
): Record<string, string> | undefined {
	if (!section) {
		return section;
	}

	const next = {...section};
	for (const [dependencyName, tarballPath] of tarballs) {
		if (dependencyName in next) {
			next[dependencyName] = `file:${tarballPath}`;
		}
	}

	return next;
}

function copyStarter(starter: string, workspaceDir: string): string {
	const src = path.join(ROOT, "starters", starter);
	const dest = path.join(workspaceDir, starter);

	cpSync(src, dest, {
		filter: (filePath) => {
			const relative = path.relative(src, filePath);
			return !(
				relative === "node_modules" ||
				relative === "dist" ||
				relative === ".next" ||
				relative === "src/generated" ||
				relative.startsWith(`src/generated${path.sep}`) ||
				relative.startsWith(`public${path.sep}img${path.sep}mapsight`)
			);
		},
		recursive: true,
	});

	return dest;
}

function prepareStarterPackageJson(
	starterDir: string,
	tarballs: Map<string, string>,
): void {
	const packageJsonPath = path.join(starterDir, "package.json");
	const pkg = JSON.parse(
		readFileSync(packageJsonPath, "utf8"),
	) as PackageJson;
	const next: PackageJson = {
		...pkg,
		dependencies: rewriteMapsightDeps(pkg.dependencies, tarballs),
		devDependencies: rewriteMapsightDeps(pkg.devDependencies, tarballs),
		overrides: Object.fromEntries(
			[...tarballs].map(([dependencyName, tarballPath]) => [
				dependencyName,
				`file:${tarballPath}`,
			]),
		),
	};

	writeFileSync(packageJsonPath, `${JSON.stringify(next, null, "\t")}\n`);
}

async function smokeStarter(
	starter: (typeof starters)[number],
	workspaceDir: string,
	tarballs: Map<string, string>,
): Promise<void> {
	const prefix = `[copy-out:${starter}] `;
	console.log(`${prefix}start`);
	const starterDir = copyStarter(starter, workspaceDir);
	prepareStarterPackageJson(starterDir, tarballs);

	await run(
		"npm",
		["install", "--no-audit", "--fund=false"],
		starterDir,
		prefix,
	);
	await run("npm", ["run", "build"], starterDir, prefix);
	console.log(`${prefix}done`);
}

async function main(): Promise<void> {
	const workspaceDir = mkdtempSync(path.join(tmpdir(), "mapsight-starters-"));
	const tarballDir = path.join(workspaceDir, "tarballs");
	mkdirSync(tarballDir);

	try {
		console.log(`[copy-out] temp dir: ${workspaceDir}`);
		const tarballs = await packMapsightPackages(tarballDir);

		await settleAllOrThrow(
			starters.map((starter) =>
				smokeStarter(starter, workspaceDir, tarballs),
			),
			"starter smoke",
		);
	} finally {
		if (KEEP_TMP) {
			console.log(`[copy-out] kept temp dir: ${workspaceDir}`);
		} else {
			rmSync(workspaceDir, {force: true, recursive: true});
		}
	}
}

await main();
