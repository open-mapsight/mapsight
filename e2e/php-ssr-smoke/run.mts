/**
 * Orchestrate PHP → Node SSR smoke:
 * 1) start sidecar
 * 2) success mode (fragment + data-dehydrated-state)
 * 3) fallback mode (client-only when sidecar is down)
 */
import {type ChildProcess, spawn, spawnSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sidecarPath = path.join(here, "sidecar.mts");
const smokePhp = path.join(here, "smoke.php");

if (process.env.SKIP_PHP_SSR_SMOKE === "1") {
	console.log("php-ssr-smoke: skipped (SKIP_PHP_SSR_SMOKE=1)");
	process.exit(0);
}

const nativePhp = resolveNativePhp();
const useDockerPhp = !nativePhp;

if (useDockerPhp) {
	const docker = spawnSync("docker", ["info"], {encoding: "utf8"});
	if (docker.status !== 0) {
		console.error(
			"php-ssr-smoke: no working `php` on PATH and Docker is unavailable.\n" +
				"Install PHP CLI, or start Docker (fallback runner), or set SKIP_PHP_SSR_SMOKE=1.",
		);
		process.exit(process.env.CI ? 1 : 0);
	}
	console.log(
		"php-ssr-smoke: native PHP unavailable; using docker.io/library/php:8.3-cli",
	);
	const pull = spawnSync("docker", ["pull", "php:8.3-cli"], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	if (pull.status !== 0) {
		console.error(
			pull.stderr || pull.stdout || "docker pull php:8.3-cli failed",
		);
		process.exit(1);
	}
}

const sidecar = spawn(process.execPath, [sidecarPath], {
	cwd: here,
	env: {
		...process.env,
		MAPSIGHT_SSR_HOST: "127.0.0.1",
		MAPSIGHT_SSR_PORT: "0",
	},
	stdio: ["ignore", "pipe", "inherit"],
});

let readyUrl = "";
const ready = await waitForReady(sidecar, 10_000);
readyUrl = ready;

try {
	runSmoke("success", readyUrl);
	// Fallback: force a dead URL so PHP exercises graceful degradation.
	runSmoke("fallback", "http://127.0.0.1:1");
	console.log("php-ssr-smoke: all checks passed");
} finally {
	sidecar.kill("SIGTERM");
}

function resolveNativePhp(): string | null {
	const probe = spawnSync("php", ["-v"], {encoding: "utf8"});
	if (probe.status === 0) {
		return "php";
	}
	return null;
}

function waitForReady(child: ChildProcess, timeoutMs: number): Promise<string> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error("sidecar did not become ready"));
		}, timeoutMs);

		child.stdout?.on("data", (buf: Buffer) => {
			const text = buf.toString("utf8");
			process.stdout.write(text);
			const match = text.match(/MAPSIGHT_SSR_READY\s+(\S+)/);
			if (match?.[1]) {
				clearTimeout(timer);
				resolve(match[1]);
			}
		});

		child.on("exit", (code) => {
			clearTimeout(timer);
			reject(new Error(`sidecar exited early (${code})`));
		});
	});
}

function runSmoke(mode: "success" | "fallback", ssrUrl: string): void {
	const env = {
		...process.env,
		MAPSIGHT_SMOKE_MODE: mode,
		MAPSIGHT_SSR_URL: ssrUrl,
	};

	if (nativePhp) {
		const result = spawnSync(nativePhp, [smokePhp], {
			cwd: here,
			env,
			encoding: "utf8",
		});
		if (result.stdout) process.stdout.write(result.stdout);
		if (result.stderr) process.stderr.write(result.stderr);
		if (result.status !== 0) {
			throw new Error(`smoke.php ${mode} failed (exit ${result.status})`);
		}
		return;
	}

	// Docker Desktop / Linux: reach host-published sidecar via host.docker.internal.
	const dockerUrl = ssrUrl.replace("127.0.0.1", "host.docker.internal");
	const result = spawnSync(
		"docker",
		[
			"run",
			"--rm",
			"--add-host=host.docker.internal:host-gateway",
			"-e",
			`MAPSIGHT_SMOKE_MODE=${mode}`,
			"-e",
			`MAPSIGHT_SSR_URL=${mode === "success" ? dockerUrl : ssrUrl}`,
			"-v",
			`${here}:/smoke:ro`,
			"-w",
			"/smoke",
			"php:8.3-cli",
			"php",
			"smoke.php",
		],
		{encoding: "utf8"},
	);
	if (result.stdout) process.stdout.write(result.stdout);
	if (result.stderr) process.stderr.write(result.stderr);
	if (result.status !== 0) {
		throw new Error(
			`smoke.php ${mode} via docker failed (exit ${result.status})`,
		);
	}
}
