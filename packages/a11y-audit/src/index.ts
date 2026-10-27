export {diffBaseline} from "./baseline.ts";
export {
	DEFAULT_AXE_TAGS,
	DEFAULT_VIEWPORTS,
	defineConfig,
	loadConfig,
	resolveConfig,
} from "./config.ts";
export {computeCoverage} from "./coverage.ts";
export {aggregate, fingerprint, groupIssues} from "./findings.ts";
export {matchLexicon} from "./checks/language.ts";
export {MANUAL_TESTS, manualTestsFor} from "./manual-tests.ts";
export {
	MAPSIGHT_ENGLISH_LEXICON,
	MAPSIGHT_MAP,
	MAPSIGHT_OWNERS,
} from "./presets/mapsight.ts";
export {renderMarkdown} from "./report-markdown.ts";
export {RULES} from "./rules.ts";
export {refreshReport, runAudit, writeReport} from "./runner.ts";
export type {RunOptions} from "./runner.ts";
export {WCAG_22_AA} from "./wcag.ts";
export type * from "./types.ts";
