import {describe, expect, it} from "vitest";

import {diffBaseline} from "./baseline.ts";
import {matchLexicon} from "./checks/language.ts";
import {resolveConfig} from "./config.ts";
import {computeCoverage} from "./coverage.ts";
import {aggregate, groupIssues} from "./findings.ts";
import {MANUAL_TESTS} from "./manual-tests.ts";
import {MAPSIGHT_ENGLISH_LEXICON} from "./presets/mapsight.ts";
import type {RawFinding, TargetReport} from "./types.ts";
import {
	WCAG_22_AA,
	levelFromAxeTags,
	scFromAxeTag,
	wcagFromAxeTags,
} from "./wcag.ts";

function raw(overrides: Partial<RawFinding> = {}): RawFinding {
	return {
		rule: "axe/listitem",
		source: "axe",
		title: "<li> elements must be contained in a <ul> or <ol>",
		description: "Fix all of the following",
		wcag: ["1.3.1"],
		level: "A",
		impact: "serious",
		status: "fail",
		element: {
			selector: "div.ms3-list > li.ms3-list__item",
			html: '<li class="ms3-list__item">',
			owner: "@mapsight/ui",
		},
		...overrides,
	};
}

const targets: TargetReport[] = [
	{
		id: "plan",
		title: "Plan",
		url: "https://example.org/plan/",
		features: ["map", "list", "search"],
		states: [
			{
				viewport: "desktop",
				scenario: "initial",
				title: "",
				steps: [],
				announcements: [],
				checks: [],
				errors: [],
			},
			{
				viewport: "mobile",
				scenario: "initial",
				title: "",
				steps: [],
				announcements: [],
				checks: [],
				errors: [],
			},
		],
	},
];

describe("wcag", () => {
	it("parses axe tags", () => {
		expect(scFromAxeTag("wcag1410")).toBe("1.4.10");
		expect(scFromAxeTag("wcag2411")).toBe("2.4.11");
		expect(scFromAxeTag("wcag21aa")).toBeUndefined();
		expect(wcagFromAxeTags(["cat.color", "wcag2aa", "wcag143"])).toEqual([
			"1.4.3",
		]);
		expect(levelFromAxeTags(["wcag2aa", "wcag143"])).toBe("AA");
		expect(levelFromAxeTags(["wcag22aa", "wcag258"])).toBe("AA");
		expect(levelFromAxeTags(["best-practice"])).toBe("best-practice");
	});

	it("lists the 55 WCAG 2.2 A/AA criteria, each with a manual test", () => {
		expect(WCAG_22_AA).toHaveLength(55);
		const manual = new Set(MANUAL_TESTS.flatMap((test) => test.wcag));
		const unknown = [...manual].filter(
			(sc) => !WCAG_22_AA.some((criterion) => criterion.sc === sc),
		);
		expect(unknown).toEqual([]);
		const coverage = computeCoverage([], [], targets, undefined);
		expect(
			coverage
				.filter((row) => row.manual.length === 0)
				.map((row) => row.sc),
		).toEqual([]);
	});
});

describe("aggregate", () => {
	it("merges viewports and states into one finding per element pattern", () => {
		const findings = aggregate([
			{
				raw: raw(),
				target: "plan",
				scenario: "initial",
				viewport: "desktop",
			},
			{
				raw: raw(),
				target: "plan",
				scenario: "initial",
				viewport: "desktop",
			},
			{
				raw: raw(),
				target: "plan",
				scenario: "search",
				viewport: "mobile",
			},
			{
				raw: raw({impact: "critical"}),
				target: "plan",
				scenario: "initial",
				viewport: "mobile",
			},
		]);
		expect(findings).toHaveLength(1);
		expect(findings[0]).toMatchObject({
			viewports: ["desktop", "mobile"],
			scenarios: ["initial", "search"],
			count: 2,
			impact: "critical",
		});
	});

	it("keeps fingerprints stable and separate per target", () => {
		const first = aggregate([
			{
				raw: raw(),
				target: "plan",
				scenario: "initial",
				viewport: "desktop",
			},
		]);
		const again = aggregate([
			{raw: raw(), target: "plan", scenario: "other", viewport: "mobile"},
		]);
		const otherTarget = aggregate([
			{
				raw: raw(),
				target: "map",
				scenario: "initial",
				viewport: "desktop",
			},
		]);
		expect(first[0]!.fingerprint).toBe(again[0]!.fingerprint);
		expect(first[0]!.fingerprint).not.toBe(otherTarget[0]!.fingerprint);
		const issues = groupIssues([...first, ...otherTarget]);
		expect(issues).toHaveLength(1);
		expect(issues[0]!.findings).toHaveLength(2);
	});

	it("sorts failures before reviews and by impact", () => {
		const findings = aggregate([
			{
				raw: raw({
					rule: "a",
					status: "needs-review",
					impact: "critical",
				}),
				target: "t",
				scenario: "initial",
				viewport: "d",
			},
			{
				raw: raw({rule: "b", impact: "minor"}),
				target: "t",
				scenario: "initial",
				viewport: "d",
			},
			{
				raw: raw({rule: "c", impact: "serious"}),
				target: "t",
				scenario: "initial",
				viewport: "d",
			},
		]);
		expect(findings.map((finding) => finding.rule)).toEqual([
			"c",
			"b",
			"a",
		]);
	});
});

describe("diffBaseline", () => {
	it("reports new, fixed and unchanged findings for states that ran", () => {
		const kept = aggregate([
			{
				raw: raw(),
				target: "plan",
				scenario: "initial",
				viewport: "desktop",
			},
		]);
		const fixed = aggregate([
			{
				raw: raw({rule: "axe/region"}),
				target: "plan",
				scenario: "initial",
				viewport: "desktop",
			},
		]);
		const notRun = aggregate([
			{
				raw: raw({rule: "axe/region"}),
				target: "other",
				scenario: "initial",
				viewport: "desktop",
			},
		]);
		const added = aggregate([
			{
				raw: raw({rule: "axe/image-alt"}),
				target: "plan",
				scenario: "initial",
				viewport: "mobile",
			},
		]);
		const diff = diffBaseline(
			{findings: [...kept, ...added], targets},
			{
				findings: [...kept, ...fixed, ...notRun],
				startedAt: "2026-10-01T00:00:00Z",
			},
			"baseline.json",
		);
		expect(diff.added).toEqual([added[0]!.fingerprint]);
		expect(diff.fixed.map((entry) => entry.fingerprint)).toEqual([
			fixed[0]!.fingerprint,
		]);
		expect(diff.persisting).toEqual([kept[0]!.fingerprint]);
	});
});

describe("computeCoverage", () => {
	const axeRules = [{id: "listitem", tags: ["wcag2a", "wcag131"]}];

	it("fails a criterion with an automated failure", () => {
		const findings = aggregate([
			{
				raw: raw(),
				target: "plan",
				scenario: "initial",
				viewport: "desktop",
			},
		]);
		const row = computeCoverage(
			findings,
			axeRules,
			targets,
			undefined,
		).find((entry) => entry.sc === "1.3.1");
		expect(row).toMatchObject({automatedResult: "fail", result: "fail"});
		expect(row?.automated).toContain("axe/listitem");
	});

	it("passes only when the manual tests pass", () => {
		const coverage = computeCoverage([], axeRules, targets, {
			results: [
				{test: "MAN-ORI-01", target: "*", result: "pass"},
				{test: "MAN-MOV-01", target: "plan", result: "n/a"},
			],
		});
		expect(coverage.find((row) => row.sc === "1.3.4")?.result).toBe("pass");
		expect(coverage.find((row) => row.sc === "2.5.4")?.result).toBe("n/a");
		expect(coverage.find((row) => row.sc === "1.3.1")).toMatchObject({
			automatedResult: "no-failures",
			result: "incomplete",
		});
	});

	it("limits a manual failure to the criteria it names", () => {
		const coverage = computeCoverage([], [], targets, {
			results: [
				{
					test: "MAN-FRM-01",
					target: "plan",
					result: "fail",
					wcag: ["3.3.1"],
				},
			],
		});
		expect(coverage.find((row) => row.sc === "3.3.1")?.result).toBe("fail");
		expect(coverage.find((row) => row.sc === "3.3.2")?.manualResult).toBe(
			"pass",
		);
	});
});

describe("matchLexicon", () => {
	it("matches English phrases and whole-string single words", () => {
		expect(matchLexicon("Zoom in", MAPSIGHT_ENGLISH_LEXICON)).toBe(
			"Zoom in",
		);
		expect(
			matchLexicon("Toggle full-screen", MAPSIGHT_ENGLISH_LEXICON),
		).toBe("Toggle full-screen");
		expect(matchLexicon("Loading list…", MAPSIGHT_ENGLISH_LEXICON)).toBe(
			"Loading list",
		);
		expect(matchLexicon("Search", MAPSIGHT_ENGLISH_LEXICON)).toBe("Search");
	});

	it("leaves German UI and data alone", () => {
		expect(
			matchLexicon("Vergrößern", MAPSIGHT_ENGLISH_LEXICON),
		).toBeUndefined();
		expect(
			matchLexicon("Open Air Kino", MAPSIGHT_ENGLISH_LEXICON),
		).toBeUndefined();
		expect(
			matchLexicon("Map Studio Braunschweig", MAPSIGHT_ENGLISH_LEXICON),
		).toBeUndefined();
		expect(
			matchLexicon("Filter", MAPSIGHT_ENGLISH_LEXICON),
		).toBeUndefined();
	});
});

describe("resolveConfig", () => {
	it("applies the Mapsight preset after host owners", () => {
		const config = resolveConfig({
			name: "x",
			owners: [{id: "host", selector: ".host"}],
			targets: [{id: "a", title: "A", url: "/"}],
		});
		expect(config.owners.map((owner) => owner.id)).toEqual([
			"host",
			"openlayers",
			"@mapsight/ui",
		]);
		expect(config.viewports.map((viewport) => viewport.id)).toEqual([
			"desktop",
			"mobile",
			"reflow",
		]);
	});

	it("rejects unknown viewports and reserved scenario ids", () => {
		expect(() =>
			resolveConfig({
				name: "x",
				targets: [
					{id: "a", title: "A", url: "/", viewports: ["tablet"]},
				],
			}),
		).toThrow(/unknown viewport/);
		expect(() =>
			resolveConfig({
				name: "x",
				targets: [
					{
						id: "a",
						title: "A",
						url: "/",
						scenarios: [
							{id: "initial", title: "", run: async () => {}},
						],
					},
				],
			}),
		).toThrow(/reserved/);
	});
});

describe("navigation timeout", () => {
	it("defaults to 60 s and accepts config and target overrides", () => {
		const targets = [
			{id: "slow", title: "Slow", url: "/", navigationTimeoutMs: 180_000},
		];
		expect(
			resolveConfig({name: "audit", targets}).navigationTimeoutMs,
		).toBe(60_000);
		const resolved = resolveConfig({
			name: "audit",
			targets,
			navigationTimeoutMs: 120_000,
		});
		expect(resolved.navigationTimeoutMs).toBe(120_000);
		expect(resolved.targets[0]?.navigationTimeoutMs).toBe(180_000);
		for (const navigationTimeoutMs of [0, -1, NaN, Infinity]) {
			expect(() =>
				resolveConfig({name: "audit", targets, navigationTimeoutMs}),
			).toThrow("navigationTimeoutMs");
			expect(() =>
				resolveConfig({
					name: "audit",
					targets: [{...targets[0]!, navigationTimeoutMs}],
				}),
			).toThrow("navigationTimeoutMs");
		}
	});
});
