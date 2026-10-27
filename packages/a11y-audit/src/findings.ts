import {createHash} from "node:crypto";

import type {Finding, Impact, RawFinding} from "./types.ts";

export const IMPACT_ORDER: Impact[] = [
	"critical",
	"serious",
	"moderate",
	"minor",
];

export function impactRank(impact: Impact): number {
	return IMPACT_ORDER.indexOf(impact);
}

export function fingerprint(parts: string[]): string {
	return createHash("sha1")
		.update(parts.join("\u0000"))
		.digest("hex")
		.slice(0, 12);
}

export interface RawEntry {
	raw: RawFinding;
	target: string;
	scenario: string;
	viewport: string;
}

/**
 * Groups node-level results into findings: one per rule, target, owner and
 * stable selector. Viewports and states are merged; `count` is the highest
 * node count seen in a single viewport and state.
 */
export function aggregate(entries: RawEntry[]): Finding[] {
	const groups = new Map<
		string,
		{finding: Finding; perViewport: Map<string, number>}
	>();
	for (const {raw, target, scenario, viewport} of entries) {
		const key = [raw.rule, target, raw.element.owner, raw.element.selector];
		const id = fingerprint(key);
		let group = groups.get(id);
		if (!group) {
			group = {
				finding: {
					fingerprint: id,
					rule: raw.rule,
					source: raw.source,
					title: raw.title,
					description: raw.description,
					wcag: raw.wcag,
					level: raw.level,
					impact: raw.impact,
					status: raw.status,
					owner: raw.element.owner,
					target,
					scenarios: [],
					viewports: [],
					selector: raw.element.selector,
					count: 0,
					examples: [],
					helpUrl: raw.helpUrl,
					fix: raw.fix,
				},
				perViewport: new Map(),
			};
			groups.set(id, group);
		}
		const {finding, perViewport} = group;
		const stateKey = `${viewport}|${scenario}`;
		perViewport.set(stateKey, (perViewport.get(stateKey) ?? 0) + 1);
		if (!finding.viewports.includes(viewport)) {
			finding.viewports.push(viewport);
		}
		if (!finding.scenarios.includes(scenario)) {
			finding.scenarios.push(scenario);
		}
		if (impactRank(raw.impact) < impactRank(finding.impact)) {
			finding.impact = raw.impact;
		}
		if (raw.status === "fail") {
			finding.status = "fail";
		}
		const exampleKey = `${raw.element.html}|${raw.element.name ?? ""}`;
		if (
			finding.examples.length < 3 &&
			!finding.examples.some(
				(example) =>
					`${example.html}|${example.name ?? ""}` === exampleKey,
			)
		) {
			finding.examples.push(raw.element);
		}
	}
	return [...groups.values()]
		.map(({finding, perViewport}) => ({
			...finding,
			count: Math.max(...perViewport.values()),
		}))
		.sort(compareFindings);
}

export function compareFindings(a: Finding, b: Finding): number {
	return (
		(a.status === b.status ? 0 : a.status === "fail" ? -1 : 1) ||
		impactRank(a.impact) - impactRank(b.impact) ||
		a.owner.localeCompare(b.owner) ||
		a.rule.localeCompare(b.rule) ||
		a.target.localeCompare(b.target) ||
		a.selector.localeCompare(b.selector)
	);
}

/** Cross-target view: the same defect (rule, owner, selector) on several targets. */
export interface Issue {
	key: string;
	rule: string;
	title: string;
	owner: string;
	selector: string;
	wcag: string[];
	level: Finding["level"];
	impact: Impact;
	status: Finding["status"];
	findings: Finding[];
}

export function groupIssues(findings: Finding[]): Issue[] {
	const issues = new Map<string, Issue>();
	for (const finding of findings) {
		const key = fingerprint([
			finding.rule,
			finding.owner,
			finding.selector,
		]);
		let issue = issues.get(key);
		if (!issue) {
			issue = {
				key,
				rule: finding.rule,
				title: finding.title,
				owner: finding.owner,
				selector: finding.selector,
				wcag: finding.wcag,
				level: finding.level,
				impact: finding.impact,
				status: finding.status,
				findings: [],
			};
			issues.set(key, issue);
		}
		issue.findings.push(finding);
		if (impactRank(finding.impact) < impactRank(issue.impact)) {
			issue.impact = finding.impact;
		}
		if (finding.status === "fail") {
			issue.status = "fail";
		}
	}
	return [...issues.values()].sort(
		(a, b) =>
			(a.status === b.status ? 0 : a.status === "fail" ? -1 : 1) ||
			impactRank(a.impact) - impactRank(b.impact) ||
			b.findings.length - a.findings.length ||
			a.rule.localeCompare(b.rule),
	);
}
