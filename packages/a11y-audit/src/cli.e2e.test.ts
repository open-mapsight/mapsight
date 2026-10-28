import {execFile} from "node:child_process";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {promisify} from "node:util";

import {expect, it} from "vitest";

import type {AuditReport} from "./types.ts";

const exec = promisify(execFile);
const cli = path.join(import.meta.dirname, "cli.ts");

it("rejects --fail-on-new without a baseline before starting a browser", async () => {
	await expect(
		exec(process.execPath, [
			cli,
			"run",
			"--config",
			"unused.mts",
			"--fail-on-new",
		]),
	).rejects.toMatchObject({
		code: 2,
		stderr: expect.stringContaining(
			"--fail-on-new requires --baseline",
		) as unknown,
	});
});

it("rejects unknown and empty filters instead of succeeding with missing states", async () => {
	const dir = await mkdtemp(path.join(tmpdir(), "a11y-filters-"));
	try {
		const config = path.join(dir, "audit.mjs");
		const baseline = path.join(dir, "baseline.json");
		await writeFile(
			config,
			`export default {
			name: "filters", preset: "none",
			viewports: [{id: "desktop", width: 1024, height: 900, checks: []}],
			targets: [{id: "fixture", title: "Fixture", url: "about:blank",
				scenarios: [{id: "broken", title: "Broken", checks: [], run: async () => {throw new Error("scenario sentinel");}}]}]
		};`,
		);
		await writeFile(
			baseline,
			JSON.stringify({startedAt: "2026-10-01T00:00:00Z", findings: []}),
		);
		for (const [flag, value, error] of [
			["--target", "fixtur", "Unknown target selection"],
			["--target", "fixture,fixtur", "Unknown target selection"],
			["--viewport", "desktpo", "Unknown viewport selection"],
			["--viewport", ",", "No viewports selected"],
			["--scenario", "brokn", "Unknown scenario selection"],
			["--scenario", ",", "No scenarios selected"],
			[
				"--concurrency",
				"invalid",
				"concurrency must be a positive integer",
			],
			["--concurrency", "0", "concurrency must be a positive integer"],
		]) {
			await expect(
				exec(process.execPath, [
					cli,
					"run",
					"--config",
					config,
					flag!,
					value!,
					"--baseline",
					baseline,
					"--fail-on",
					"serious",
					"--fail-on-new",
					"--browser",
					"/browser-must-not-start",
				]),
			).rejects.toMatchObject({
				code: 2,
				stderr: expect.stringContaining(error!) as unknown,
			});
		}
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

it("writes the report but exits 2 when a scenario cannot execute", async () => {
	const dir = await mkdtemp(path.join(tmpdir(), "a11y-cli-"));
	try {
		const url = pathToFileURL(
			path.join(import.meta.dirname, "test-fixtures/defects.html"),
		).href;
		const config = path.join(dir, "audit.mjs");
		await writeFile(
			config,
			`export default {
			name: "execution failure", preset: "none",
			viewports: [{id: "desktop", width: 1024, height: 900, checks: []}],
			targets: [{id: "fixture", title: "Fixture", url: ${JSON.stringify(url)}, settleMs: 0,
				scenarios: [{id: "broken", title: "Broken", checks: [], run: async () => {throw new Error("scenario sentinel");}}]}]
		};`,
		);
		await expect(
			exec(process.execPath, [
				cli,
				"run",
				"--config",
				config,
				"--out",
				dir,
				"--scenario",
				"broken",
			]),
		).rejects.toMatchObject({
			code: 2,
			stderr: expect.stringContaining(
				"audit execution errors",
			) as unknown,
		});
		const report = JSON.parse(
			await readFile(path.join(dir, "report.json"), "utf8"),
		) as AuditReport;
		expect(report.targets[0]!.states[1]!.errors).toContain(
			"scenario: scenario sentinel",
		);
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

it("blocks new serious findings and accepts an unchanged baseline", async () => {
	const dir = await mkdtemp(path.join(tmpdir(), "a11y-gate-"));
	try {
		const url = pathToFileURL(
			path.join(import.meta.dirname, "test-fixtures/defects.html"),
		).href;
		const config = path.join(dir, "audit.mjs");
		const baseline = path.join(dir, "baseline.json");
		await writeFile(
			config,
			`export default {name:"gate", preset:"none", viewports:[{id:"desktop",width:1024,height:900,checks:["axe"]}], targets:[{id:"fixture",title:"Fixture",url:${JSON.stringify(url)},root:"#app",settleMs:0}]};`,
		);
		await writeFile(
			baseline,
			JSON.stringify({startedAt: "2026-10-01T00:00:00Z", findings: []}),
		);
		const args = [
			cli,
			"run",
			"--config",
			config,
			"--out",
			dir,
			"--baseline",
			baseline,
			"--fail-on",
			"serious",
			"--fail-on-new",
		];
		await expect(exec(process.execPath, args)).rejects.toMatchObject({
			code: 1,
		});
		await writeFile(
			baseline,
			await readFile(path.join(dir, "report.json")),
		);
		await exec(process.execPath, args);
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});
