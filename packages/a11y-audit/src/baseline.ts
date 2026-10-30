import type {AuditReport, BaselineDiff, Finding} from "./types.ts";

/**
 * Compares findings by fingerprint. Baseline findings for targets, viewports
 * or scenarios that were not part of this run are ignored rather than
 * counted as fixed.
 */
export function diffBaseline(
	current: Pick<AuditReport, "findings" | "targets">,
	baseline: Pick<AuditReport, "findings" | "startedAt">,
	baselinePath: string,
): BaselineDiff {
	const ranStates = new Set(
		current.targets.flatMap((target) =>
			target.states.map((state) => `${target.id}|${state.scenario}`),
		),
	);
	const ranViewports = new Set(
		current.targets.flatMap((target) =>
			target.states.map((state) => `${target.id}|${state.viewport}`),
		),
	);
	const comparable = (finding: Finding) =>
		finding.scenarios.some((scenario) =>
			ranStates.has(`${finding.target}|${scenario.split(" › ")[0]}`),
		) &&
		finding.viewports.some((viewport) =>
			ranViewports.has(`${finding.target}|${viewport}`),
		);
	const currentIds = new Set(
		current.findings.map((finding) => finding.fingerprint),
	);
	const baselineFindings = baseline.findings.filter(comparable);
	const baselineIds = new Set(
		baselineFindings.map((finding) => finding.fingerprint),
	);
	return {
		baseline: baselinePath,
		baselineDate: baseline.startedAt,
		added: current.findings
			.filter((finding) => !baselineIds.has(finding.fingerprint))
			.map((finding) => finding.fingerprint),
		fixed: baselineFindings
			.filter((finding) => !currentIds.has(finding.fingerprint))
			.map(({fingerprint, rule, target, title}) => ({
				fingerprint,
				rule,
				target,
				title,
			})),
		persisting: current.findings
			.filter((finding) => baselineIds.has(finding.fingerprint))
			.map((finding) => finding.fingerprint),
	};
}
