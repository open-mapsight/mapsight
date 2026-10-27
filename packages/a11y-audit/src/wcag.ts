import type {Level} from "./types.ts";

export interface SuccessCriterion {
	sc: string;
	title: string;
	level: "A" | "AA";
	since: "2.0" | "2.1" | "2.2";
}

/**
 * WCAG 2.2 Level A and AA (4.1.1 Parsing is obsolete in 2.2 and left out).
 * `since` lets reports state WCAG 2.1 AA, which EN 301 549 / BITV 2.0 cite.
 */
export const WCAG_22_AA: SuccessCriterion[] = [
	{sc: "1.1.1", title: "Non-text Content", level: "A", since: "2.0"},
	{
		sc: "1.2.1",
		title: "Audio-only and Video-only (Prerecorded)",
		level: "A",
		since: "2.0",
	},
	{sc: "1.2.2", title: "Captions (Prerecorded)", level: "A", since: "2.0"},
	{
		sc: "1.2.3",
		title: "Audio Description or Media Alternative (Prerecorded)",
		level: "A",
		since: "2.0",
	},
	{sc: "1.2.4", title: "Captions (Live)", level: "AA", since: "2.0"},
	{
		sc: "1.2.5",
		title: "Audio Description (Prerecorded)",
		level: "AA",
		since: "2.0",
	},
	{sc: "1.3.1", title: "Info and Relationships", level: "A", since: "2.0"},
	{sc: "1.3.2", title: "Meaningful Sequence", level: "A", since: "2.0"},
	{sc: "1.3.3", title: "Sensory Characteristics", level: "A", since: "2.0"},
	{sc: "1.3.4", title: "Orientation", level: "AA", since: "2.1"},
	{sc: "1.3.5", title: "Identify Input Purpose", level: "AA", since: "2.1"},
	{sc: "1.4.1", title: "Use of Color", level: "A", since: "2.0"},
	{sc: "1.4.2", title: "Audio Control", level: "A", since: "2.0"},
	{sc: "1.4.3", title: "Contrast (Minimum)", level: "AA", since: "2.0"},
	{sc: "1.4.4", title: "Resize Text", level: "AA", since: "2.0"},
	{sc: "1.4.5", title: "Images of Text", level: "AA", since: "2.0"},
	{sc: "1.4.10", title: "Reflow", level: "AA", since: "2.1"},
	{sc: "1.4.11", title: "Non-text Contrast", level: "AA", since: "2.1"},
	{sc: "1.4.12", title: "Text Spacing", level: "AA", since: "2.1"},
	{
		sc: "1.4.13",
		title: "Content on Hover or Focus",
		level: "AA",
		since: "2.1",
	},
	{sc: "2.1.1", title: "Keyboard", level: "A", since: "2.0"},
	{sc: "2.1.2", title: "No Keyboard Trap", level: "A", since: "2.0"},
	{sc: "2.1.4", title: "Character Key Shortcuts", level: "A", since: "2.1"},
	{sc: "2.2.1", title: "Timing Adjustable", level: "A", since: "2.0"},
	{sc: "2.2.2", title: "Pause, Stop, Hide", level: "A", since: "2.0"},
	{
		sc: "2.3.1",
		title: "Three Flashes or Below Threshold",
		level: "A",
		since: "2.0",
	},
	{sc: "2.4.1", title: "Bypass Blocks", level: "A", since: "2.0"},
	{sc: "2.4.2", title: "Page Titled", level: "A", since: "2.0"},
	{sc: "2.4.3", title: "Focus Order", level: "A", since: "2.0"},
	{sc: "2.4.4", title: "Link Purpose (In Context)", level: "A", since: "2.0"},
	{sc: "2.4.5", title: "Multiple Ways", level: "AA", since: "2.0"},
	{sc: "2.4.6", title: "Headings and Labels", level: "AA", since: "2.0"},
	{sc: "2.4.7", title: "Focus Visible", level: "AA", since: "2.0"},
	{
		sc: "2.4.11",
		title: "Focus Not Obscured (Minimum)",
		level: "AA",
		since: "2.2",
	},
	{sc: "2.5.1", title: "Pointer Gestures", level: "A", since: "2.1"},
	{sc: "2.5.2", title: "Pointer Cancellation", level: "A", since: "2.1"},
	{sc: "2.5.3", title: "Label in Name", level: "A", since: "2.1"},
	{sc: "2.5.4", title: "Motion Actuation", level: "A", since: "2.1"},
	{sc: "2.5.7", title: "Dragging Movements", level: "AA", since: "2.2"},
	{sc: "2.5.8", title: "Target Size (Minimum)", level: "AA", since: "2.2"},
	{sc: "3.1.1", title: "Language of Page", level: "A", since: "2.0"},
	{sc: "3.1.2", title: "Language of Parts", level: "AA", since: "2.0"},
	{sc: "3.2.1", title: "On Focus", level: "A", since: "2.0"},
	{sc: "3.2.2", title: "On Input", level: "A", since: "2.0"},
	{sc: "3.2.3", title: "Consistent Navigation", level: "AA", since: "2.0"},
	{
		sc: "3.2.4",
		title: "Consistent Identification",
		level: "AA",
		since: "2.0",
	},
	{sc: "3.2.6", title: "Consistent Help", level: "A", since: "2.2"},
	{sc: "3.3.1", title: "Error Identification", level: "A", since: "2.0"},
	{sc: "3.3.2", title: "Labels or Instructions", level: "A", since: "2.0"},
	{sc: "3.3.3", title: "Error Suggestion", level: "AA", since: "2.0"},
	{
		sc: "3.3.4",
		title: "Error Prevention (Legal, Financial, Data)",
		level: "AA",
		since: "2.0",
	},
	{sc: "3.3.7", title: "Redundant Entry", level: "A", since: "2.2"},
	{
		sc: "3.3.8",
		title: "Accessible Authentication (Minimum)",
		level: "AA",
		since: "2.2",
	},
	{sc: "4.1.2", title: "Name, Role, Value", level: "A", since: "2.0"},
	{sc: "4.1.3", title: "Status Messages", level: "AA", since: "2.1"},
];

const BY_SC = new Map(WCAG_22_AA.map((criterion) => [criterion.sc, criterion]));

export function getCriterion(sc: string): SuccessCriterion | undefined {
	return BY_SC.get(sc);
}

/** `wcag1410` → `1.4.10`; anything else → undefined. */
export function scFromAxeTag(tag: string): string | undefined {
	const match = /^wcag(\d)(\d)(\d{1,2})$/.exec(tag);
	if (!match) {
		return undefined;
	}
	return `${match[1]}.${match[2]}.${match[3]}`;
}

/** Level from axe tags; WCAG SC tags win over best-practice. */
export function levelFromAxeTags(tags: string[]): Level {
	if (tags.some((tag) => /^wcag2(1|2)?a$/.test(tag))) {
		return "A";
	}
	if (tags.some((tag) => /^wcag2(1|2)?aa$/.test(tag))) {
		return "AA";
	}
	if (tags.some((tag) => /^wcag2(1|2)?aaa$/.test(tag))) {
		return "AAA";
	}
	return "best-practice";
}

export function wcagFromAxeTags(tags: string[]): string[] {
	return tags.flatMap((tag) => scFromAxeTag(tag) ?? []);
}

export function compareSc(a: string, b: string): number {
	const pa = a.split(".").map(Number);
	const pb = b.split(".").map(Number);
	for (let index = 0; index < 3; index++) {
		const difference = (pa[index] ?? 0) - (pb[index] ?? 0);
		if (difference !== 0) {
			return difference;
		}
	}
	return 0;
}
