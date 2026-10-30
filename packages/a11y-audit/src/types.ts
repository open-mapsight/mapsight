import type {Locator, Page} from "playwright";

/** Same scale as axe-core, so axe and Mapsight checks sort together. */
export type Impact = "critical" | "serious" | "moderate" | "minor";

export type Level = "A" | "AA" | "AAA" | "best-practice";

/**
 * `fail`: the check observed a defect.
 * `needs-review`: the check found something it cannot decide on its own
 * (e.g. text over the map canvas for colour contrast).
 */
export type FindingStatus = "fail" | "needs-review";

export type CheckId =
	| "axe"
	| "keyboard"
	| "dialogs"
	| "map"
	| "language"
	| "text-spacing"
	| "reflow";

export interface Owner {
	id: string;
	label?: string;
	/** CSS selector; the closest matching ancestor of a node decides its owner. */
	selector: string;
}

export interface Viewport {
	id: string;
	width: number;
	height: number;
	/** Touch device emulation (mobile layouts that switch on pointer type). */
	isMobile?: boolean;
	hasTouch?: boolean;
	/** Checks run on the initial state in this viewport. */
	checks?: CheckId[];
}

export interface ScenarioContext {
	page: Page;
	/** The integration root (`target.root`). */
	root: Locator;
	target: TargetConfig;
	viewport: Viewport;
	/** Log a step; shows up in the report next to the scenario. */
	step(message: string): void;
}

export interface Scenario {
	id: string;
	title: string;
	/** Viewport ids this scenario runs in (default: every viewport of the target). */
	viewports?: string[];
	run(context: ScenarioContext): Promise<void>;
	/** Checks run on the state the scenario leaves behind (default: axe). */
	checks?: CheckId[];
	/**
	 * Expect at least one live-region announcement while the scenario runs
	 * (WCAG 4.1.3). A RegExp must match one of the announcements.
	 */
	expectAnnouncement?: boolean | RegExp;
	/** Expect focus to end inside this selector after the scenario (2.4.3). */
	expectFocusWithin?: string;
}

export interface TargetConfig {
	id: string;
	title: string;
	/** Absolute, or relative to `baseUrl`. */
	url: string;
	/** Free-form integration type, used to group targets in the report. */
	integration?: string;
	/** CSS selector of the integration root. Defaults to `body`. */
	root?: string;
	/** Wait until this selector is visible before checking. */
	readySelector?: string;
	/** Extra wait after ready, for tiles, fonts and lazy lists (ms). */
	settleMs?: number;
	/** Navigation timeout in ms; overrides the config default. */
	navigationTimeoutMs?: number;
	/** Viewport ids (from the config's `viewports`). */
	viewports?: string[];
	scenarios?: Scenario[];
	/** Selectors axe should skip (e.g. third-party widgets on the host page). */
	exclude?: string[];
	/** HTTP basic auth, e.g. read from env in the config file. */
	httpCredentials?: {username: string; password: string};
	/** Manual test ids from the catalogue that apply (default: all that match `features`). */
	features?: TargetFeature[];
	/** Language the integration is expected to use (default: `<html lang>`). */
	language?: string;
	/**
	 * Reason to leave this target out of default runs (e.g. not public yet).
	 * It still runs when selected explicitly with `--target`.
	 */
	skip?: string;
}

/** Feature flags that select manual tests and map checks. */
export type TargetFeature =
	| "map"
	| "list"
	| "search"
	| "details"
	| "filters"
	| "layers"
	| "form"
	| "tour"
	| "live-data"
	| "install";

export interface MapOptions {
	/** Selector of the map viewport element (default `.ol-viewport`). */
	viewport: string;
	/** Selectors inside the map that are controls, not the map surface. */
	controls: string;
}

export interface AuditConfig {
	/** Name shown in the report title. */
	name: string;
	baseUrl?: string;
	/** Navigation timeout in ms (default 60_000). */
	navigationTimeoutMs?: number;
	/** BCP 47 locale for the browser context (default `de-DE`). */
	locale?: string;
	/** Apply Mapsight defaults (owners, map selectors, English UI lexicon). */
	preset?: "mapsight" | "none";
	owners?: Owner[];
	/** Owner for nodes outside the integration root (host page / CMS template). */
	hostOwner?: string;
	viewports?: Viewport[];
	targets: TargetConfig[];
	map?: Partial<MapOptions>;
	/** Extra English UI strings to flag on non-English pages. */
	englishLexicon?: string[];
	/** axe-core tags (default WCAG 2.0–2.2 A/AA + best-practice). */
	axeTags?: string[];
	/** axe rule ids to disable. */
	axeDisableRules?: string[];
	/** Max Tab presses per keyboard walk (default 150). */
	maxTabStops?: number;
	/** Max aria-expanded / aria-haspopup triggers tested per state (default 20). */
	maxDialogTriggers?: number;
}

export interface ResolvedConfig extends Required<
	Omit<
		AuditConfig,
		"baseUrl" | "map" | "preset" | "englishLexicon" | "axeDisableRules"
	>
> {
	baseUrl?: string;
	preset: "mapsight" | "none";
	map: MapOptions;
	englishLexicon: string[];
	axeDisableRules: string[];
}

export interface ElementInfo {
	/** Grouping selector, stable across data changes (no nth-child, no ids with digits). */
	selector: string;
	/** Opening tag, truncated. */
	html: string;
	owner: string;
	role?: string;
	name?: string;
}

export interface Finding {
	/** Stable id: rule + target + owner + selector (independent of viewport and state). */
	fingerprint: string;
	rule: string;
	source: "axe" | "mapsight";
	title: string;
	description: string;
	wcag: string[];
	level: Level;
	impact: Impact;
	status: FindingStatus;
	owner: string;
	target: string;
	/** States (initial, scenario ids, open popups) in which it was seen. */
	scenarios: string[];
	viewports: string[];
	selector: string;
	count: number;
	examples: ElementInfo[];
	helpUrl?: string;
	fix?: string;
}

/** A finding before aggregation (one node, one viewport). */
export interface RawFinding {
	rule: string;
	source: "axe" | "mapsight";
	title: string;
	description: string;
	wcag: string[];
	level: Level;
	impact: Impact;
	status: FindingStatus;
	element: ElementInfo;
	helpUrl?: string;
	fix?: string;
}

export interface TabStop {
	index: number;
	selector: string;
	owner: string;
	role: string;
	name: string;
	flags: string[];
}

export interface StateReport {
	viewport: string;
	scenario: string;
	title: string;
	screenshot?: string;
	steps: string[];
	announcements: string[];
	tabOrder?: TabStop[];
	checks: CheckId[];
	/** Informational notes that do not indicate an incomplete check. */
	notes?: string[];
	errors: string[];
}

export interface TargetReport {
	id: string;
	title: string;
	url: string;
	integration?: string;
	features: TargetFeature[];
	states: StateReport[];
}

export interface SkippedTarget {
	id: string;
	title: string;
	url: string;
	reason: string;
}

export type ManualResultValue = "pass" | "fail" | "n/a" | "not-tested";

export interface ManualResult {
	test: string;
	/** Target id, or "*" for all targets. */
	target: string;
	result: ManualResultValue;
	/** For failures: the success criteria that failed (default: all of the test's). */
	wcag?: string[];
	notes?: string;
	/** Optional finding-style details for failures. */
	impact?: Impact;
	owner?: string;
}

export interface ManualResults {
	tester?: string;
	date?: string;
	environment?: string;
	results: ManualResult[];
}

export interface CoverageRow {
	sc: string;
	title: string;
	level: "A" | "AA";
	since: "2.0" | "2.1" | "2.2";
	automated: string[];
	manual: string[];
	automatedResult: "fail" | "needs-review" | "no-failures" | "not-covered";
	manualResult: ManualResultValue | "mixed";
	result: "fail" | "pass" | "n/a" | "incomplete";
}

export interface BaselineDiff {
	baseline: string;
	baselineDate?: string;
	added: string[];
	fixed: Array<Pick<Finding, "fingerprint" | "rule" | "target" | "title">>;
	persisting: string[];
}

export interface AuditReport {
	tool: {name: string; version: string; axe: string; browser: string};
	name: string;
	baseUrl?: string;
	startedAt: string;
	finishedAt: string;
	targets: TargetReport[];
	skipped?: SkippedTarget[];
	findings: Finding[];
	/** axe rules that ran (id + tags), for the coverage matrix. */
	axeRules: Array<{id: string; tags: string[]}>;
	coverage: CoverageRow[];
	manual?: ManualResults;
	baseline?: BaselineDiff;
}
