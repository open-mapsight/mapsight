import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

import type AxeCore from "axe-core";

import type {Impact} from "../types.ts";
import {levelFromAxeTags, wcagFromAxeTags} from "../wcag.ts";
import type {CheckContext} from "./context.ts";

const require = createRequire(import.meta.url);

type AxeGlobal = typeof AxeCore;

let axeSource: string | undefined;

function getAxeSource(): string {
	axeSource ??= readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
	return axeSource;
}

export interface AxeRuleInfo {
	id: string;
	tags: string[];
}

interface AxeNodeResult {
	kind: "fail" | "needs-review";
	id: string;
	help: string;
	helpUrl: string;
	tags: string[];
	impact: Impact | null;
	summary: string;
	element: {selector: string; html: string; owner: string};
}

async function ensureAxe(context: CheckContext): Promise<void> {
	const loaded = await context.page.evaluate(
		() => typeof (window as unknown as {axe?: unknown}).axe !== "undefined",
	);
	if (!loaded) {
		// evaluate() is not subject to the page's CSP, unlike a script tag.
		await context.page.evaluate(getAxeSource());
	}
}

export async function axeInfo(
	context: CheckContext,
): Promise<{version: string; rules: AxeRuleInfo[]}> {
	await ensureAxe(context);
	return context.page.evaluate((tags) => {
		const axe = (window as unknown as {axe: AxeGlobal}).axe;
		return {
			version: axe.version,
			rules: axe.getRules(tags).map((ruleInfo) => ({
				id: ruleInfo.ruleId,
				tags: ruleInfo.tags,
			})),
		};
	}, context.config.axeTags);
}

/**
 * Runs axe-core on the integration root plus any open dialogs portalled
 * outside it. Violations become `fail`, incomplete results `needs-review`.
 */
export async function runAxe(context: CheckContext): Promise<void> {
	await ensureAxe(context);
	const results = await context.page.evaluate(
		async ({tags, disabled, exclude}) => {
			const api = window.__mapsightA11y!;
			const axe = (window as unknown as {axe: AxeGlobal}).axe;
			const root = api.root();
			if (!root) {
				return null;
			}
			const include: string[][] = [[api.config.root]];
			for (const popup of document.querySelectorAll(
				'dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]',
			)) {
				if (!root.contains(popup) && api.isVisible(popup)) {
					include.push([`[data-a11y-audit-id="${api.mark(popup)}"]`]);
				}
			}
			const result = await axe.run(
				{include, exclude: exclude.map((selector) => [selector])},
				{
					runOnly: {type: "tag", values: tags},
					rules: Object.fromEntries(
						disabled.map((id) => [id, {enabled: false}]),
					),
					resultTypes: ["violations", "incomplete"],
				},
			);
			const out: AxeNodeResult[] = [];
			const collect = (
				kind: "fail" | "needs-review",
				list: AxeCore.Result[],
			) => {
				for (const violation of list) {
					for (const node of violation.nodes) {
						let element: Element | null = null;
						const selector = node.target[node.target.length - 1];
						if (typeof selector === "string") {
							try {
								element = document.querySelector(selector);
							} catch {
								element = null;
							}
						}
						out.push({
							kind,
							id: violation.id,
							help: violation.help,
							helpUrl: violation.helpUrl,
							tags: violation.tags,
							impact: node.impact ?? violation.impact ?? null,
							summary: String(node.failureSummary ?? "")
								.replace(/\s+/g, " ")
								.trim(),
							element: element
								? api.describe(element)
								: {
										selector: node.target
											.map(String)
											.join(" "),
										html: String(node.html).slice(0, 240),
										owner: "unattributed",
									},
						});
					}
				}
			};
			collect("fail", result.violations);
			collect("needs-review", result.incomplete);
			return out;
		},
		{
			tags: context.config.axeTags,
			disabled: context.config.axeDisableRules,
			exclude: context.target.exclude ?? [],
		},
	);
	if (!results) {
		context.note(`axe: root ${context.target.root ?? "body"} not found`);
		return;
	}
	for (const result of results) {
		context.report({
			rule: `axe/${result.id}`,
			source: "axe",
			title: result.help,
			description: result.summary || result.help,
			wcag: wcagFromAxeTags(result.tags),
			level: levelFromAxeTags(result.tags),
			impact: result.impact ?? "moderate",
			status: result.kind,
			element: result.element,
			helpUrl: result.helpUrl,
		});
	}
}
