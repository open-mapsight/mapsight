import type {CheckId, Impact, Level} from "./types.ts";

export interface RuleMeta {
	id: string;
	check: CheckId;
	title: string;
	wcag: string[];
	level: Level;
	impact: Impact;
	fix: string;
}

/** Mapsight checks beyond axe-core. Ids are stable; reports and baselines key on them. */
export const RULES: Record<string, RuleMeta> = {
	"keyboard/focus-visible": {
		id: "keyboard/focus-visible",
		check: "keyboard",
		title: "Keyboard focus is not visible",
		wcag: ["2.4.7"],
		level: "AA",
		impact: "serious",
		fix: "Add a :focus-visible style (e.g. a 2px outline with at least 3:1 contrast against both neighbours). Never remove the outline without a replacement.",
	},
	"keyboard/focus-hidden-element": {
		id: "keyboard/focus-hidden-element",
		check: "keyboard",
		title: "Focus lands on an element that is not visible",
		wcag: ["2.4.7", "2.4.3"],
		level: "AA",
		impact: "serious",
		fix: "Show the element while it has focus (skip links), or take hidden content out of the tab order (`hidden`, `inert`, `display: none`, or `tabindex=-1` while collapsed).",
	},
	"keyboard/focus-obscured": {
		id: "keyboard/focus-obscured",
		check: "keyboard",
		title: "Focused element is completely covered by other content",
		wcag: ["2.4.11"],
		level: "AA",
		impact: "serious",
		fix: "Keep sticky or overlay chrome from covering focused elements (scroll-padding, scroll the element clear of the overlay, or close the overlay when focus moves away).",
	},
	"keyboard/focus-unnamed": {
		id: "keyboard/focus-unnamed",
		check: "keyboard",
		title: "Focusable element has no accessible name",
		wcag: ["4.1.2"],
		level: "A",
		impact: "serious",
		fix: "Give the control a visible label, `aria-label` or `aria-labelledby`; icon-only buttons need a text alternative.",
	},
	"keyboard/focus-no-role": {
		id: "keyboard/focus-no-role",
		check: "keyboard",
		title: "Focusable element has no interactive role",
		wcag: ["4.1.2"],
		level: "A",
		impact: "moderate",
		fix: "Use a native `<button>`/`<a href>`, or add the matching role and keyboard handling. Remove `tabindex` from elements that are not interactive (scroll containers excepted: give those a role such as `region` and a name).",
	},
	"keyboard/trap": {
		id: "keyboard/trap",
		check: "keyboard",
		title: "Keyboard focus cannot leave the integration with Tab",
		wcag: ["2.1.2"],
		level: "A",
		impact: "critical",
		fix: "Only trap focus inside an open modal dialog; release the trap when it closes.",
	},
	"keyboard/walk-incomplete": {
		id: "keyboard/walk-incomplete",
		check: "keyboard",
		title: "Tab walk did not leave the integration within the step limit",
		wcag: ["2.1.2", "2.4.1"],
		level: "A",
		impact: "moderate",
		fix: "Check for a focus loop or a very long tab sequence; offer a way to skip long lists.",
	},
	"keyboard/not-focusable-clickable": {
		id: "keyboard/not-focusable-clickable",
		check: "keyboard",
		title: "Clickable element cannot be reached with the keyboard",
		wcag: ["2.1.1"],
		level: "A",
		impact: "serious",
		fix: "Use a native `<button>`/`<a href>`, or make the element focusable and operable with Enter/Space. For composite widgets with roving tabindex, make sure arrow keys reach every item.",
	},
	"keyboard/bypass": {
		id: "keyboard/bypass",
		check: "keyboard",
		title: "Long tab sequence without a way to skip the integration",
		wcag: ["2.4.1"],
		level: "A",
		impact: "moderate",
		fix: "Offer a skip link before the integration (or before long lists), or reduce tab stops with roving tabindex in composite widgets.",
	},
	"dialog/activation-key": {
		id: "dialog/activation-key",
		check: "dialogs",
		title: "Control reacts to a click but not to Enter or Space",
		wcag: ["2.1.1"],
		level: "A",
		impact: "serious",
		fix: "Use a native `<button>`, or handle Enter and Space on `role=button` elements.",
	},
	"dialog/expanded-state": {
		id: "dialog/expanded-state",
		check: "dialogs",
		title: "aria-expanded does not reflect the open state",
		wcag: ["4.1.2"],
		level: "A",
		impact: "moderate",
		fix: "Set `aria-expanded` to `true` while the controlled popup or region is open and back to `false` when it closes.",
	},
	"dialog/name": {
		id: "dialog/name",
		check: "dialogs",
		title: "Dialog has no accessible name",
		wcag: ["4.1.2"],
		level: "A",
		impact: "serious",
		fix: "Point `aria-labelledby` at the dialog heading, or set `aria-label`.",
	},
	"dialog/initial-focus": {
		id: "dialog/initial-focus",
		check: "dialogs",
		title: "Focus does not move into the opened dialog",
		wcag: ["2.4.3"],
		level: "A",
		impact: "serious",
		fix: "Move focus to the first meaningful element (or the dialog heading) when the dialog opens (APG Dialog pattern).",
	},
	"dialog/focus-containment": {
		id: "dialog/focus-containment",
		check: "dialogs",
		title: "Focus leaves an open modal dialog",
		wcag: ["2.4.3"],
		level: "A",
		impact: "serious",
		fix: "Use `<dialog>.showModal()` or a focus scope that contains Tab while the modal is open, and make the background inert.",
	},
	"dialog/escape": {
		id: "dialog/escape",
		check: "dialogs",
		title: "Escape does not close the popup",
		wcag: [],
		level: "best-practice",
		impact: "moderate",
		fix: "Close dialogs, menus and popovers on Escape (APG); return focus to the trigger.",
	},
	"dialog/focus-return": {
		id: "dialog/focus-return",
		check: "dialogs",
		title: "Focus is not returned to the trigger after closing",
		wcag: ["2.4.3"],
		level: "A",
		impact: "serious",
		fix: "Restore focus to the element that opened the popup when it closes (react-aria `FocusScope restoreFocus`, or keep a ref to the trigger).",
	},
	"map/name": {
		id: "map/name",
		check: "map",
		title: "Map has no accessible name or role",
		wcag: ["1.1.1", "4.1.2"],
		level: "A",
		impact: "moderate",
		fix: "Wrap the map viewport in an element with a role (e.g. `region` or `application`) and a name such as „Karte: Stadtplan“, and describe where the same information is available as text (list).",
	},
	"map/keyboard-focus": {
		id: "map/keyboard-focus",
		check: "map",
		title: "Map surface cannot receive keyboard focus",
		wcag: ["2.1.1"],
		level: "A",
		impact: "serious",
		fix: "Make the map viewport focusable (`tabindex=0`, OpenLayers `keyboardEventTarget`) so KeyboardPan/KeyboardZoom work, and give it a visible focus style.",
	},
	"map/keyboard-pan": {
		id: "map/keyboard-pan",
		check: "map",
		title: "Arrow keys do not move the focused map",
		wcag: ["2.1.1"],
		level: "A",
		impact: "serious",
		fix: "Enable OpenLayers KeyboardPan/KeyboardZoom interactions on the focusable map viewport.",
	},
	"language/untranslated": {
		id: "language/untranslated",
		check: "language",
		title: "Interface text is in a different language than the page",
		wcag: ["3.1.2"],
		level: "AA",
		impact: "moderate",
		fix: "Translate the string (e.g. register host translations for Mapsight UI and OpenLayers control labels) or mark it with `lang`.",
	},
	"text-spacing/clipped": {
		id: "text-spacing/clipped",
		check: "text-spacing",
		title: "Text is cut off when text spacing is increased",
		wcag: ["1.4.12"],
		level: "AA",
		impact: "serious",
		fix: "Avoid fixed heights and `overflow: hidden` on text containers; let them grow (min-height, no line-clamp without a way to read the full text).",
	},
	"reflow/horizontal-scroll": {
		id: "reflow/horizontal-scroll",
		check: "reflow",
		title: "Content needs horizontal scrolling at 320 CSS px",
		wcag: ["1.4.10"],
		level: "AA",
		impact: "serious",
		fix: "Let the element shrink or wrap below 320 px (no fixed min-width, flex-wrap, max-width: 100%). The map itself is exempt; its chrome is not.",
	},
	"reflow/clipped-control": {
		id: "reflow/clipped-control",
		check: "reflow",
		title: "Control is rendered but cut off at 320 CSS px",
		wcag: ["1.4.10"],
		level: "AA",
		impact: "moderate",
		fix: "Make the container scroll or wrap so the control stays reachable, or remove hidden controls from the tab order.",
	},
	"live/no-announcement": {
		id: "live/no-announcement",
		check: "axe",
		title: "Result of an action is not announced",
		wcag: ["4.1.3"],
		level: "AA",
		impact: "moderate",
		fix: "Announce result counts, loading and errors in a persistent `role=status` (polite) region that exists before its text changes.",
	},
	"focus/expected-target": {
		id: "focus/expected-target",
		check: "axe",
		title: "Focus does not move to the content the action revealed",
		wcag: ["2.4.3"],
		level: "A",
		impact: "moderate",
		fix: "Move focus to the revealed content (its heading or container with `tabindex=-1`) or keep it on the trigger and announce the change.",
	},
};

export function rule(id: string): RuleMeta {
	const meta = RULES[id];
	if (!meta) {
		throw new Error(`Unknown rule ${id}`);
	}
	return meta;
}

/** SC → Mapsight rule ids, for the coverage matrix. */
export function rulesBySc(): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const meta of Object.values(RULES)) {
		for (const sc of meta.wcag) {
			map.set(sc, [...(map.get(sc) ?? []), meta.id]);
		}
	}
	return map;
}
