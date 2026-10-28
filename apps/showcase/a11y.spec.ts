import {execFile} from "node:child_process";
import path from "node:path";
import {promisify} from "node:util";

import {test} from "@playwright/test";

const exec = promisify(execFile);

test("showcase has no new serious accessibility failures or audit execution errors", async ({
	baseURL,
}) => {
	const repoRoot = path.resolve(import.meta.dirname, "../..");
	await exec(
		process.execPath,
		[
			"packages/a11y-audit/src/cli.ts",
			"run",
			"--config",
			"apps/showcase/a11y.config.mts",
			"--base-url",
			baseURL!,
			"--baseline",
			"apps/showcase/a11y-baseline.json",
			"--out",
			"apps/showcase/a11y-report",
			"--fail-on",
			"serious",
			"--fail-on-new",
		],
		{cwd: repoRoot, timeout: 570_000},
	);
});
