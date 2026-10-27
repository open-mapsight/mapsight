import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

import {type Browser, type Page, chromium} from "playwright";

import {diffBaseline} from "./baseline.ts";
import {type AxeRuleInfo, axeInfo, runAxe} from "./checks/axe.ts";
import {type CheckContext, reportRule, settle} from "./checks/context.ts";
import {dialogContract} from "./checks/dialogs.ts";
import {keyboardWalk} from "./checks/keyboard.ts";
import {languageCheck} from "./checks/language.ts";
import {reflowCheck, textSpacingCheck} from "./checks/layout.ts";
import {mapChecks} from "./checks/map.ts";
import {resolveConfig, targetUrl} from "./config.ts";
import {computeCoverage} from "./coverage.ts";
import {type RawEntry, aggregate} from "./findings.ts";
import {type InPageConfig, installInPage} from "./page/instrument.ts";
import {renderMarkdown} from "./report-markdown.ts";
import type {
	AuditConfig,
	AuditReport,
	CheckId,
	ManualResults,
	ResolvedConfig,
	Scenario,
	StateReport,
	TargetConfig,
	TargetReport,
	Viewport,
} from "./types.ts";

export interface RunOptions {
	config: AuditConfig;
	/** Directory for report.json, report.md and screenshots. */
	outDir: string;
	/** Only these target ids. */
	targets?: string[];
	/** Only these viewport ids. */
	viewports?: string[];
	/** Only these scenario ids (plus the initial state). */
	scenarios?: string[];
	baseUrl?: string;
	headed?: boolean;
	/** Chromium executable; default: Playwright's bundled browser. */
	browserPath?: string;
	/** Targets audited in parallel (default 1). */
	concurrency?: number;
	manual?: ManualResults;
	baseline?: {path: string; report: AuditReport};
	log?: (message: string) => void;
}

const DEFAULT_SCENARIO_CHECKS: CheckId[] = ["axe"];

async function readToolVersion(): Promise<string> {
	try {
		const packageJson = JSON.parse(
			await readFile(new URL("../package.json", import.meta.url), "utf8"),
		) as {version: string};
		return packageJson.version;
	} catch {
		return "unknown";
	}
}

function inPageConfig(
	config: ResolvedConfig,
	target: TargetConfig,
): InPageConfig {
	return {
		root: target.root ?? "body",
		owners: config.owners.map(({id, selector}) => ({id, selector})),
		hostOwner: config.hostOwner,
		mapViewport: config.map.viewport,
		mapControls: config.map.controls,
	};
}

async function waitUntilReady(
	page: Page,
	target: TargetConfig,
	url: string,
): Promise<void> {
	await page.goto(url, {waitUntil: "domcontentloaded", timeout: 60_000});
	await page
		.locator(target.root ?? "body")
		.first()
		.waitFor({state: "attached", timeout: 30_000});
	if (target.readySelector) {
		await page
			.locator(target.readySelector)
			.first()
			.waitFor({state: "visible", timeout: 45_000});
	}
	await page.evaluate(() => document.fonts.ready.then(() => undefined));
	await page.waitForTimeout(target.settleMs ?? 2500);
}

async function auditViewport(
	browser: Browser,
	config: ResolvedConfig,
	target: TargetConfig,
	viewport: Viewport,
	options: RunOptions,
	entries: RawEntry[],
	axeRules: Map<string, AxeRuleInfo>,
	meta: {axeVersion: string},
): Promise<StateReport[]> {
	const log = options.log ?? (() => undefined);
	const url = targetUrl(target.url, options.baseUrl ?? config.baseUrl);
	const browserContext = await browser.newContext({
		viewport: {width: viewport.width, height: viewport.height},
		isMobile: viewport.isMobile ?? false,
		hasTouch: viewport.hasTouch ?? false,
		deviceScaleFactor: 1,
		locale: config.locale,
		reducedMotion: "reduce",
		httpCredentials: target.httpCredentials,
	});
	const states: StateReport[] = [];
	try {
		const page = await browserContext.newPage();
		await page.addInitScript(installInPage, inPageConfig(config, target));
		const cdp = await browserContext.newCDPSession(page);
		await cdp.send("Accessibility.enable");
		const pageErrors: string[] = [];
		page.on("pageerror", (error) =>
			pageErrors.push(`page error: ${error.message.split("\n")[0]}`),
		);
		const screenshotDir = path.join(options.outDir, "screenshots");
		await mkdir(screenshotDir, {recursive: true});

		const runState = async (
			scenario: Scenario | null,
			checks: CheckId[],
		): Promise<StateReport> => {
			const scenarioId = scenario?.id ?? "initial";
			const state: StateReport = {
				viewport: viewport.id,
				scenario: scenarioId,
				title: scenario?.title ?? "Initial state",
				steps: [],
				announcements: [],
				checks,
				errors: [],
			};
			const context: CheckContext = {
				page,
				cdp,
				config,
				target,
				viewport,
				reload: async () => {
					await waitUntilReady(page, target, url);
				},
				report: (raw) =>
					entries.push({
						raw,
						target: target.id,
						scenario: scenarioId,
						viewport: viewport.id,
					}),
				note: (message) => state.errors.push(message),
			};
			const attempt = async (label: string, run: () => Promise<void>) => {
				try {
					await run();
				} catch (error) {
					state.errors.push(
						`${label}: ${(error as Error).message.split("\n")[0]}`,
					);
				}
			};
			pageErrors.length = 0;
			log(`${target.id} · ${viewport.id} · ${scenarioId}`);
			try {
				await waitUntilReady(page, target, url);
			} catch (error) {
				state.errors.push(
					`load: ${(error as Error).message.split("\n")[0]}`,
				);
				return state;
			}
			if (meta.axeVersion === "") {
				const info = await axeInfo(context);
				meta.axeVersion = info.version;
				for (const axeRule of info.rules) {
					axeRules.set(axeRule.id, axeRule);
				}
			}
			await page.evaluate(() => {
				window.__mapsightA11y!.announcements.length = 0;
			});

			if (scenario) {
				let failed = false;
				await attempt("scenario", async () => {
					try {
						await scenario.run({
							page,
							root: page.locator(target.root ?? "body").first(),
							target,
							viewport,
							step: (message) => state.steps.push(message),
						});
					} catch (error) {
						failed = true;
						throw error;
					}
				});
				await settle(page, 500);
				state.announcements = await page.evaluate(() => [
					...window.__mapsightA11y!.announcements,
				]);
				if (!failed && scenario.expectAnnouncement) {
					const expected = scenario.expectAnnouncement;
					const matched =
						expected instanceof RegExp
							? state.announcements.some((text) =>
									expected.test(text),
								)
							: state.announcements.length > 0;
					if (!matched) {
						const rootInfo = await page.evaluate(() => {
							const api = window.__mapsightA11y!;
							const root = api.root();
							return root ? api.describe(root) : null;
						});
						if (rootInfo) {
							reportRule(
								context,
								"live/no-announcement",
								rootInfo,
								state.announcements.length
									? `"${scenario.title}": announcements did not match ${String(expected)}: ${state.announcements.join(" / ")}`
									: `"${scenario.title}": nothing was announced in a live region.`,
							);
						}
					}
				}
				if (!failed && scenario.expectFocusWithin) {
					const focus = await page.evaluate((selector) => {
						const api = window.__mapsightA11y!;
						const active = api.deepActiveElement();
						const container = document.querySelector(selector);
						return {
							inside: Boolean(
								active && container?.contains(active),
							),
							active: active ? api.describe(active) : null,
							container: container
								? api.describe(container)
								: null,
						};
					}, scenario.expectFocusWithin);
					if (!focus.inside && focus.container) {
						reportRule(
							context,
							"focus/expected-target",
							focus.container,
							`"${scenario.title}": focus is on ${focus.active?.selector ?? "the document"} instead of inside ${scenario.expectFocusWithin}.`,
						);
					}
				}
				if (failed) {
					states.push(state);
					return state;
				}
			}

			const file =
				`${target.id}-${viewport.id}-${scenarioId}.png`.replace(
					/[^\w.-]+/g,
					"_",
				);
			await attempt("screenshot", async () => {
				await page.screenshot({
					path: path.join(screenshotDir, file),
					animations: "disabled",
				});
				state.screenshot = `screenshots/${file}`;
			});

			// order matters: read-only checks first, state-changing ones last
			if (checks.includes("axe")) {
				await attempt("axe", () => runAxe(context));
			}
			if (checks.includes("language")) {
				await attempt("language", () => languageCheck(context));
			}
			if (checks.includes("reflow")) {
				await attempt("reflow", () => reflowCheck(context));
			}
			if (checks.includes("keyboard")) {
				await attempt("keyboard", async () => {
					state.tabOrder = await keyboardWalk(context);
				});
			}
			if (checks.includes("map")) {
				await attempt("map", () => mapChecks(context));
			}
			if (checks.includes("text-spacing")) {
				await attempt("text-spacing", () => textSpacingCheck(context));
			}
			if (checks.includes("dialogs")) {
				await attempt("dialogs", async () => {
					await context.reload();
					await dialogContract(context, async (label) => {
						if (checks.includes("axe")) {
							const openScenario = `${scenarioId} › open “${label}”`;
							await runAxe({
								...context,
								report: (raw) =>
									entries.push({
										raw,
										target: target.id,
										scenario: openScenario,
										viewport: viewport.id,
									}),
							});
						}
					});
				});
			}
			state.errors.push(...new Set(pageErrors));
			return state;
		};

		const initialChecks = viewport.checks ?? ["axe"];
		states.push(await runState(null, initialChecks));
		for (const scenario of target.scenarios ?? []) {
			if (
				scenario.viewports &&
				!scenario.viewports.includes(viewport.id)
			) {
				continue;
			}
			if (options.scenarios && !options.scenarios.includes(scenario.id)) {
				continue;
			}
			const state = await runState(
				scenario,
				scenario.checks ?? DEFAULT_SCENARIO_CHECKS,
			);
			if (!states.includes(state)) {
				states.push(state);
			}
		}
	} finally {
		await browserContext.close();
	}
	return states;
}

export async function runAudit(options: RunOptions): Promise<AuditReport> {
	const config = resolveConfig(options.config);
	const startedAt = new Date().toISOString();
	const targets = config.targets.filter((target) =>
		options.targets ? options.targets.includes(target.id) : !target.skip,
	);
	const skipped = options.targets
		? []
		: config.targets
				.filter((target) => target.skip)
				.map((target) => ({
					id: target.id,
					title: target.title,
					url: targetUrl(
						target.url,
						options.baseUrl ?? config.baseUrl,
					),
					reason: target.skip!,
				}));
	if (targets.length === 0) {
		throw new Error("No targets selected.");
	}
	const browser = await chromium.launch({
		headless: !options.headed,
		executablePath: options.browserPath,
	});
	const entries: RawEntry[] = [];
	const axeRules = new Map<string, AxeRuleInfo>();
	const meta = {axeVersion: ""};
	const targetReports: TargetReport[] = [];
	try {
		const queue = [...targets];
		const worker = async () => {
			for (let target = queue.shift(); target; target = queue.shift()) {
				const viewportIds = (
					target.viewports ??
					config.viewports.map((viewport) => viewport.id)
				).filter(
					(id) =>
						!options.viewports || options.viewports.includes(id),
				);
				const report: TargetReport = {
					id: target.id,
					title: target.title,
					url: targetUrl(
						target.url,
						options.baseUrl ?? config.baseUrl,
					),
					integration: target.integration,
					features: target.features ?? [],
					states: [],
				};
				targetReports.push(report);
				for (const id of viewportIds) {
					const viewport = config.viewports.find(
						(candidate) => candidate.id === id,
					)!;
					report.states.push(
						...(await auditViewport(
							browser,
							config,
							target,
							viewport,
							options,
							entries,
							axeRules,
							meta,
						)),
					);
				}
			}
		};
		await Promise.all(
			Array.from({length: Math.max(1, options.concurrency ?? 1)}, worker),
		);
		targetReports.sort(
			(a, b) =>
				targets.findIndex((target) => target.id === a.id) -
				targets.findIndex((target) => target.id === b.id),
		);
		const findings = aggregate(entries);
		const axeRuleList = [...axeRules.values()].sort((a, b) =>
			a.id.localeCompare(b.id),
		);
		const report: AuditReport = {
			tool: {
				name: "@mapsight/a11y-audit",
				version: await readToolVersion(),
				axe: meta.axeVersion,
				browser: `Chromium ${browser.version()}`,
			},
			name: config.name,
			baseUrl: options.baseUrl ?? config.baseUrl,
			startedAt,
			finishedAt: new Date().toISOString(),
			targets: targetReports,
			skipped,
			findings,
			axeRules: axeRuleList,
			coverage: computeCoverage(
				findings,
				axeRuleList,
				targetReports,
				options.manual,
			),
			manual: options.manual,
		};
		if (options.baseline) {
			report.baseline = diffBaseline(
				report,
				options.baseline.report,
				options.baseline.path,
			);
		}
		return report;
	} finally {
		await browser.close();
	}
}

/** Recomputes coverage and baseline for an existing report (e.g. new manual results). */
export function refreshReport(
	report: AuditReport,
	options: {
		manual?: ManualResults;
		baseline?: {path: string; report: AuditReport};
	},
): AuditReport {
	const manual = options.manual ?? report.manual;
	const next: AuditReport = {
		...report,
		manual,
		coverage: computeCoverage(
			report.findings,
			report.axeRules,
			report.targets,
			manual,
		),
	};
	if (options.baseline) {
		next.baseline = diffBaseline(
			next,
			options.baseline.report,
			options.baseline.path,
		);
	}
	return next;
}

export async function writeReport(
	report: AuditReport,
	outDir: string,
): Promise<void> {
	await mkdir(outDir, {recursive: true});
	await writeFile(
		path.join(outDir, "report.json"),
		`${JSON.stringify(report, null, "\t")}\n`,
	);
	await writeFile(path.join(outDir, "report.md"), renderMarkdown(report));
}
