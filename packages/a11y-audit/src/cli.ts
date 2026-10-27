#!/usr/bin/env node
import {readFile} from "node:fs/promises";
import path from "node:path";
import {parseArgs} from "node:util";

import {loadConfig, resolveConfig} from "./config.ts";
import {impactRank} from "./findings.ts";
import {manualTestsFor} from "./manual-tests.ts";
import {refreshReport, runAudit, writeReport} from "./runner.ts";
import type {AuditReport, Impact, ManualResults} from "./types.ts";

const HELP = `mapsight-a11y-audit — rerunnable accessibility audit for Mapsight integrations

Usage:
  mapsight-a11y-audit run --config <file> [options]
  mapsight-a11y-audit report --input <report.json> [--manual <file>] [--baseline <report.json>] [--out <dir>]
  mapsight-a11y-audit manual-template --config <file>

run options:
  --config <file>         Audit config (.mjs, .mts or .ts with a default export)
  --out <dir>             Output directory (default: a11y-report)
  --target <ids>          Comma-separated target ids
  --viewport <ids>        Comma-separated viewport ids
  --scenario <ids>        Comma-separated scenario ids (initial state always runs)
  --base-url <url>        Override the config's baseUrl (e.g. a preview or local dev server)
  --baseline <file>       Earlier report.json to diff against (new / fixed / unchanged)
  --manual <file>         Manual results JSON to merge into the coverage matrix
  --fail-on <impact>      Exit 1 when a failure of this impact or worse exists (critical|serious|moderate|minor)
  --fail-on-new           With --baseline: only count new failures for --fail-on
  --concurrency <n>       Targets in parallel (default 1)
  --browser <path>        Chromium executable (default: Playwright's; env MAPSIGHT_A11Y_BROWSER)
  --headed                Show the browser
`;

async function readJson<T>(file: string): Promise<T> {
	return JSON.parse(await readFile(file, "utf8")) as T;
}

function list(value: string | undefined): string[] | undefined {
	return value
		?.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

async function main(argv: string[]): Promise<number> {
	const [command, ...rest] = argv;
	const {values} = parseArgs({
		args: command?.startsWith("-") ? [] : rest,
		options: {
			config: {type: "string"},
			out: {type: "string"},
			target: {type: "string"},
			viewport: {type: "string"},
			scenario: {type: "string"},
			"base-url": {type: "string"},
			baseline: {type: "string"},
			manual: {type: "string"},
			input: {type: "string"},
			"fail-on": {type: "string"},
			"fail-on-new": {type: "boolean"},
			concurrency: {type: "string"},
			browser: {type: "string"},
			headed: {type: "boolean"},
			help: {type: "boolean"},
		},
	});
	if (!command || values.help || ["help", "--help", "-h"].includes(command)) {
		process.stdout.write(HELP);
		return 0;
	}
	const manual = values.manual
		? await readJson<ManualResults>(values.manual)
		: undefined;
	const baseline = values.baseline
		? {
				path: values.baseline,
				report: await readJson<AuditReport>(values.baseline),
			}
		: undefined;

	if (command === "manual-template") {
		if (!values.config) {
			throw new Error("--config is required");
		}
		const config = resolveConfig(await loadConfig(values.config));
		const template: ManualResults = {
			tester: "",
			date: new Date().toISOString().slice(0, 10),
			environment:
				"e.g. NVDA 2026.x + Firefox, VoiceOver iOS 26 + Safari",
			results: config.targets.flatMap((target) =>
				manualTestsFor(target.features ?? []).map((test) => ({
					test: test.id,
					target: target.id,
					result: "not-tested" as const,
					notes: "",
				})),
			),
		};
		process.stdout.write(`${JSON.stringify(template, null, "\t")}\n`);
		return 0;
	}

	if (command === "report") {
		if (!values.input) {
			throw new Error("--input is required");
		}
		const report = refreshReport(
			await readJson<AuditReport>(values.input),
			{
				manual,
				baseline,
			},
		);
		await writeReport(report, values.out ?? path.dirname(values.input));
		return 0;
	}

	if (command !== "run") {
		process.stderr.write(`Unknown command "${command}".\n\n${HELP}`);
		return 2;
	}
	if (!values.config) {
		throw new Error("--config is required");
	}
	const outDir = values.out ?? "a11y-report";
	const report = await runAudit({
		config: await loadConfig(values.config),
		outDir,
		targets: list(values.target),
		viewports: list(values.viewport),
		scenarios: list(values.scenario),
		baseUrl: values["base-url"],
		headed: values.headed,
		browserPath: values.browser ?? process.env.MAPSIGHT_A11Y_BROWSER,
		concurrency: values.concurrency
			? Number(values.concurrency)
			: undefined,
		manual,
		baseline,
		log: (message) => process.stderr.write(`· ${message}\n`),
	});
	await writeReport(report, outDir);
	const fails = report.findings.filter(
		(finding) => finding.status === "fail",
	);
	process.stderr.write(
		`${fails.length} failures, ${report.findings.length - fails.length} to review → ${path.join(outDir, "report.md")}\n`,
	);
	const threshold = values["fail-on"] as Impact | undefined;
	if (threshold) {
		const added = new Set(report.baseline?.added ?? []);
		const blocking = fails.filter(
			(finding) =>
				impactRank(finding.impact) <= impactRank(threshold) &&
				(!values["fail-on-new"] || added.has(finding.fingerprint)),
		);
		if (blocking.length > 0) {
			process.stderr.write(
				`${blocking.length} failures at or above "${threshold}".\n`,
			);
			return 1;
		}
	}
	return 0;
}

main(process.argv.slice(2)).then(
	(code) => {
		process.exitCode = code;
	},
	(error: unknown) => {
		process.stderr.write(`${(error as Error).stack ?? String(error)}\n`);
		process.exitCode = 2;
	},
);
