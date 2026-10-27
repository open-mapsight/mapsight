import {MANUAL_TESTS, manualTestsBySc} from "./manual-tests.ts";
import {rulesBySc} from "./rules.ts";
import type {
	CoverageRow,
	Finding,
	ManualResultValue,
	ManualResults,
	TargetReport,
} from "./types.ts";
import {WCAG_22_AA, wcagFromAxeTags} from "./wcag.ts";

type Verdict = ManualResultValue | "mixed";

/**
 * Manual verdict for one test across the targets it applies to. With `sc`,
 * a failure only counts if it names that criterion (or names none).
 */
export function manualVerdict(
	testId: string,
	targets: Pick<TargetReport, "id" | "features">[],
	manual: ManualResults | undefined,
	sc?: string,
): Verdict {
	const test = MANUAL_TESTS.find((candidate) => candidate.id === testId);
	if (!test) {
		return "not-tested";
	}
	const applicable = targets.filter(
		(target) =>
			test.features.length === 0 ||
			test.features.some((feature) => target.features.includes(feature)),
	);
	if (applicable.length === 0) {
		return "n/a";
	}
	return combine(
		applicable.map((target) => {
			const result =
				manual?.results.find(
					(entry) =>
						entry.test === testId && entry.target === target.id,
				) ??
				manual?.results.find(
					(entry) => entry.test === testId && entry.target === "*",
				);
			if (!result) {
				return "not-tested";
			}
			if (
				result.result === "fail" &&
				sc &&
				result.wcag &&
				!result.wcag.includes(sc)
			) {
				return "pass";
			}
			return result.result;
		}),
	);
}

function combine(verdicts: Verdict[]): Verdict {
	if (verdicts.includes("fail")) {
		return "fail";
	}
	const tested = verdicts.filter((verdict) => verdict !== "not-tested");
	if (tested.length === 0) {
		return "not-tested";
	}
	if (tested.length < verdicts.length || tested.includes("mixed")) {
		return "mixed";
	}
	return tested.every((verdict) => verdict === "n/a") ? "n/a" : "pass";
}

/**
 * One row per WCAG 2.2 A/AA criterion: which automated rules and manual tests
 * cover it and what they found. A criterion only passes when its manual tests
 * pass, because automated checks alone cannot prove conformance.
 */
export function computeCoverage(
	findings: Finding[],
	axeRules: Array<{id: string; tags: string[]}>,
	targets: Pick<TargetReport, "id" | "features">[],
	manual: ManualResults | undefined,
): CoverageRow[] {
	const customBySc = rulesBySc();
	const manualBySc = manualTestsBySc();
	return WCAG_22_AA.map((criterion) => {
		const automated = [
			...axeRules
				.filter((axeRule) =>
					wcagFromAxeTags(axeRule.tags).includes(criterion.sc),
				)
				.map((axeRule) => `axe/${axeRule.id}`),
			...(customBySc.get(criterion.sc) ?? []),
		];
		const related = findings.filter((finding) =>
			finding.wcag.includes(criterion.sc),
		);
		const automatedResult: CoverageRow["automatedResult"] = related.some(
			(finding) => finding.status === "fail",
		)
			? "fail"
			: related.length > 0
				? "needs-review"
				: automated.length > 0
					? "no-failures"
					: "not-covered";
		const manualTests = manualBySc.get(criterion.sc) ?? [];
		const manualResult = combine(
			manualTests.map((testId) =>
				manualVerdict(testId, targets, manual, criterion.sc),
			),
		);
		let result: CoverageRow["result"];
		if (automatedResult === "fail" || manualResult === "fail") {
			result = "fail";
		} else if (manualResult === "n/a") {
			result = "n/a";
		} else if (manualResult === "pass") {
			result = "pass";
		} else {
			result = "incomplete";
		}
		return {
			sc: criterion.sc,
			title: criterion.title,
			level: criterion.level,
			since: criterion.since,
			automated,
			manual: manualTests,
			automatedResult,
			manualResult,
			result,
		};
	});
}
