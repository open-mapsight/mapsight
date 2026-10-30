import {IMPACT_ORDER, type Issue, groupIssues} from "./findings.ts";
import {MANUAL_TESTS} from "./manual-tests.ts";
import type {AuditReport, Finding} from "./types.ts";
import {getCriterion} from "./wcag.ts";

function escapeCell(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/\|/g, "\\|")
		.replace(/\n/g, " ");
}

function code(value: string): string {
	const fence = value.includes("`") ? "``" : "`";
	return `${fence}${value}${fence}`;
}

function wcagLabel(wcag: string[], level: string): string {
	if (wcag.length === 0) {
		return level === "best-practice" ? "Best practice" : level;
	}
	return wcag
		.map((sc) => {
			const criterion = getCriterion(sc);
			return criterion
				? `${sc} ${criterion.title} (${criterion.level})`
				: sc;
		})
		.join(", ");
}

function states(scenarios: string[]): string {
	// states derived from one already listed ("initial › open …") add nothing
	const shown = scenarios.filter(
		(scenario) =>
			!scenarios.some(
				(other) =>
					other !== scenario && scenario.startsWith(`${other} › `),
			),
	);
	return shown.length > 4
		? `${shown.slice(0, 4).join(", ")} +${shown.length - 4} more`
		: shown.join(", ");
}

function affected(issue: Issue): string {
	return issue.findings
		.map(
			(finding) =>
				`${finding.target} (${finding.viewports.join(", ")}; ${states(finding.scenarios)})`,
		)
		.join(" · ");
}

function countBy(findings: Finding[], owner?: string) {
	const relevant = owner
		? findings.filter((finding) => finding.owner === owner)
		: findings;
	const fails = relevant.filter((finding) => finding.status === "fail");
	return {
		...Object.fromEntries(
			IMPACT_ORDER.map((impact) => [
				impact,
				fails.filter((finding) => finding.impact === impact).length,
			]),
		),
		review: relevant.length - fails.length,
	} as Record<(typeof IMPACT_ORDER)[number] | "review", number>;
}

export function renderMarkdown(report: AuditReport): string {
	const lines: string[] = [];
	const push = (...values: string[]) => lines.push(...values);
	const added = new Set(report.baseline?.added ?? []);
	const issues = groupIssues(report.findings);
	const owners = [
		...new Set(report.findings.map((finding) => finding.owner)),
	].sort();

	push(
		`# Accessibility audit: ${report.name}`,
		"",
		`- Run: ${report.startedAt} – ${report.finishedAt}`,
		...(report.baseUrl ? [`- Base URL: ${report.baseUrl}`] : []),
		`- Tools: ${report.tool.name} ${report.tool.version}, axe-core ${report.tool.axe}, ${report.tool.browser}`,
		"- Standard: WCAG 2.2 Level A and AA. Criteria new in 2.2 are marked; the rest is the WCAG 2.1 AA set that EN 301 549 / BITV 2.0 cite.",
		"- Automated checks find a subset of problems. A criterion counts as passed only when its manual tests pass (see coverage).",
		"",
		"## Summary",
		"",
		"Failures by owner and impact (counted per finding: one rule, target, state and element pattern).",
		"",
		"| Owner | critical | serious | moderate | minor | needs review |",
		"| --- | ---: | ---: | ---: | ---: | ---: |",
	);
	for (const owner of owners) {
		const counts = countBy(report.findings, owner);
		push(
			`| ${owner} | ${counts.critical} | ${counts.serious} | ${counts.moderate} | ${counts.minor} | ${counts.review} |`,
		);
	}
	const total = countBy(report.findings);
	push(
		`| **total** | **${total.critical}** | **${total.serious}** | **${total.moderate}** | **${total.minor}** | **${total.review}** |`,
		"",
	);
	if (report.baseline) {
		push(
			`Compared with ${report.baseline.baseline} (${report.baseline.baselineDate ?? "unknown date"}): **${report.baseline.added.length} new**, **${report.baseline.fixed.length} fixed**, ${report.baseline.persisting.length} unchanged.`,
			"",
		);
	}
	const coverageCounts = report.coverage.reduce<Record<string, number>>(
		(counts, row) => {
			counts[row.result] = (counts[row.result] ?? 0) + 1;
			return counts;
		},
		{},
	);
	push(
		`WCAG 2.2 A/AA criteria: ${coverageCounts.fail ?? 0} fail, ${coverageCounts.pass ?? 0} pass, ${coverageCounts["n/a"] ?? 0} not applicable, ${coverageCounts.incomplete ?? 0} incomplete (manual tests outstanding).`,
		"",
		"## Targets",
		"",
		"| Target | Integration | URL | critical | serious | moderate | minor | needs review |",
		"| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
	);
	for (const target of report.targets) {
		const counts = countBy(
			report.findings.filter((finding) => finding.target === target.id),
		);
		push(
			`| ${target.id} | ${target.integration ?? ""} | ${target.url} | ${counts.critical} | ${counts.serious} | ${counts.moderate} | ${counts.minor} | ${counts.review} |`,
		);
	}
	push("");
	for (const target of report.skipped ?? []) {
		push(`Skipped: ${target.id} (${target.url}) — ${target.reason}`);
	}
	if (report.skipped?.length) {
		push("");
	}

	push(
		"## Failures by owner",
		"",
		"Each entry groups the same rule on the same element pattern across targets. `new` marks entries not in the baseline.",
		"",
	);
	for (const owner of owners) {
		const ownerIssues = issues.filter(
			(issue) => issue.owner === owner && issue.status === "fail",
		);
		if (ownerIssues.length === 0) {
			continue;
		}
		push(`### ${owner}`, "");
		ownerIssues.forEach((issue, index) => {
			const first = issue.findings[0]!;
			const isNew = issue.findings.some((finding) =>
				added.has(finding.fingerprint),
			);
			push(
				`#### ${owner}-${index + 1}. [${issue.impact}] ${issue.title}${isNew ? " `new`" : ""}`,
				"",
				`- Rule: ${code(issue.rule)} · WCAG: ${wcagLabel(issue.wcag, issue.level)}`,
				`- Element: ${code(issue.selector)}`,
				`- Affects: ${affected(issue)}`,
				`- Nodes: up to ${Math.max(...issue.findings.map((finding) => finding.count))} per state`,
			);
			for (const example of first.examples.slice(0, 2)) {
				push(
					`- Example: ${code(example.html)}${example.name ? ` — "${example.name}"` : ""}`,
				);
			}
			push(`- Detail: ${first.description}`);
			if (first.fix) {
				push(`- Fix: ${first.fix}`);
			}
			if (first.helpUrl) {
				push(`- Reference: ${first.helpUrl}`);
			}
			push(
				`- Fingerprints: ${issue.findings.map((finding) => code(finding.fingerprint)).join(" ")}`,
				"",
			);
		});
	}

	const reviews = issues.filter((issue) => issue.status === "needs-review");
	if (reviews.length > 0) {
		push(
			"## Needs review",
			"",
			"Automated checks could not decide these; a person has to look.",
			"",
			"| Impact | Rule | Owner | Element | Targets | Detail |",
			"| --- | --- | --- | --- | --- | --- |",
		);
		for (const issue of reviews) {
			push(
				`| ${issue.impact} | ${code(issue.rule)} | ${issue.owner} | ${code(escapeCell(issue.selector))} | ${escapeCell([...new Set(issue.findings.map((finding) => finding.target))].join(", "))} | ${escapeCell(issue.findings[0]!.description.slice(0, 160))} |`,
			);
		}
		push("");
	}

	if (report.baseline && report.baseline.fixed.length > 0) {
		push("## Fixed since baseline", "");
		for (const fixed of report.baseline.fixed) {
			push(
				`- ${code(fixed.rule)} on ${fixed.target}: ${fixed.title} (${code(fixed.fingerprint)})`,
			);
		}
		push("");
	}

	push(
		"## WCAG 2.2 A/AA coverage",
		"",
		"`Automated`: result of the automated rules mapped to the criterion. `Manual`: verdict of the manual tests (see the catalogue below); `mixed` = tested on some targets only.",
		"",
		"| SC | Criterion | Level | Automated | Manual | Result |",
		"| --- | --- | --- | --- | --- | --- |",
	);
	for (const row of report.coverage) {
		push(
			`| ${row.sc} | ${row.title}${row.since === "2.2" ? " (2.2)" : ""} | ${row.level} | ${row.automatedResult} (${row.automated.length} rules) | ${row.manualResult} (${row.manual.join(", ") || "—"}) | **${row.result}** |`,
		);
	}
	push("");

	push("## Manual test catalogue", "");
	for (const test of MANUAL_TESTS) {
		const results = (report.manual?.results ?? []).filter(
			(entry) => entry.test === test.id,
		);
		push(
			`- **${test.id}** ${test.title} (${test.wcag.join(", ")}${test.features.length ? `; applies to: ${test.features.join(", ")}` : ""}) — pass when: ${test.pass}`,
		);
		for (const result of results) {
			push(
				`  - ${result.target}: **${result.result}**${result.notes ? ` — ${result.notes}` : ""}`,
			);
		}
	}
	push("");
	if (report.manual) {
		push(
			`Manual results: ${report.manual.tester ?? "unknown tester"}, ${report.manual.date ?? "undated"}${report.manual.environment ? `, ${report.manual.environment}` : ""}.`,
			"",
		);
	}

	push("## Tab order", "");
	for (const target of report.targets) {
		for (const state of target.states) {
			if (!state.tabOrder?.length) {
				continue;
			}
			push(
				"<details>",
				`<summary>${target.id} · ${state.viewport} · ${state.scenario} (${state.tabOrder.length} stops)</summary>`,
				"",
				"| # | Role | Name | Owner | Flags | Element |",
				"| ---: | --- | --- | --- | --- | --- |",
			);
			for (const stop of state.tabOrder) {
				push(
					`| ${stop.index} | ${stop.role} | ${escapeCell(stop.name)} | ${stop.owner} | ${stop.flags.join(", ")} | ${code(escapeCell(stop.selector))} |`,
				);
			}
			push("", "</details>", "");
		}
	}

	const stateNotes = report.targets.flatMap((target) =>
		target.states.flatMap((state) => [
			...(state.steps.length || state.announcements.length
				? [
						`- ${target.id} · ${state.viewport} · ${state.scenario}: ${state.steps.length ? `steps: ${state.steps.join(" → ")}. ` : ""}${state.announcements.length ? `announced: ${state.announcements.map((text) => `“${text}”`).join(", ")}` : "no live-region announcements"}`,
					]
				: []),
			...(state.notes ?? []).map(
				(note) =>
					`- ${target.id} · ${state.viewport} · ${state.scenario}: ${note}`,
			),
			...state.errors.map(
				(error) =>
					`- ${target.id} · ${state.viewport} · ${state.scenario}: ⚠ ${error}`,
			),
		]),
	);
	if (stateNotes.length > 0) {
		push("## Scenario log and run notes", "", ...stateNotes, "");
	}
	return `${lines.join("\n")}\n`;
}
