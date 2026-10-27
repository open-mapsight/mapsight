import type {TargetFeature} from "./types.ts";

export interface ManualTest {
	id: string;
	title: string;
	wcag: string[];
	/** Applies when the target has one of these features; empty = every target. */
	features: TargetFeature[];
	steps: string[];
	pass: string;
}

/**
 * Checks automation cannot decide. Each has fixed steps and a pass criterion,
 * so two testers reach the same verdict. Record results in a manual results
 * file (see README) and pass it with `--manual`.
 */
export const MANUAL_TESTS: ManualTest[] = [
	{
		id: "MAN-SR-01",
		title: "Screen reader identifies the map and where its content is available as text",
		wcag: ["1.1.1", "1.3.1", "4.1.2"],
		features: ["map"],
		steps: [
			"Start NVDA + Firefox (Windows) or VoiceOver + Safari (macOS/iOS).",
			"Move through the integration with the virtual cursor / swipe.",
		],
		pass: "The map is announced with a role and a meaningful name, and its information (places, layers, live values) is also reachable as text (list, details, legend).",
	},
	{
		id: "MAN-SR-02",
		title: "Selecting a list entry opens details that a screen reader user can find",
		wcag: ["2.4.3", "4.1.2", "4.1.3"],
		features: ["list", "details"],
		steps: [
			"With a screen reader, activate an entry in the list.",
			"Note what is announced and where focus is.",
		],
		pass: "The selection is announced (state or focus move) and the details are reached in one step (focus moves to them, or they follow directly in reading order).",
	},
	{
		id: "MAN-SR-03",
		title: "Search results, filter results and loading states are announced",
		wcag: ["4.1.3"],
		features: ["search", "filters", "list"],
		steps: [
			"With a screen reader, type a search term and wait.",
			"Toggle a filter/tag or layer that changes the list.",
		],
		pass: "Result counts (or 'no results'), loading and errors are announced without moving focus.",
	},
	{
		id: "MAN-SR-04",
		title: "Details content has a usable structure",
		wcag: ["1.3.1", "2.4.4", "2.4.6"],
		features: ["details"],
		steps: [
			"Open the details of three different places (CMS content, live data, address).",
			"List headings and links with the screen reader's elements list.",
		],
		pass: "The details start with a heading naming the place; links have unique, descriptive names in context; data tables/lists use real markup.",
	},
	{
		id: "MAN-KB-01",
		title: "Everything on the map can be reached without pointing at the map",
		wcag: ["2.1.1", "1.1.1"],
		features: ["map"],
		steps: [
			"Using only the keyboard, try to reach each kind of object shown on the map (places, live values, areas, stands) and its details.",
		],
		pass: "Every object type shown on the map has a keyboard path to its information (list, search or focusable features).",
	},
	{
		id: "MAN-KB-02",
		title: "Map tools work with the keyboard",
		wcag: ["2.1.1", "2.1.4"],
		features: ["map"],
		steps: [
			"With the keyboard only: zoom in/out, pan, change layers, locate me, fullscreen, measure, share position, context menu (if offered).",
			"Check whether any single-character shortcut fires while typing elsewhere on the page.",
		],
		pass: "All tools are operable by keyboard; single-character shortcuts are absent, can be turned off/remapped, or only work while the map has focus.",
	},
	{
		id: "MAN-KB-03",
		title: "Keyboard-only walkthrough of the main task",
		wcag: ["2.1.2", "2.4.1", "2.4.7", "2.4.11"],
		features: [],
		steps: [
			"Without a mouse: find a place (search or list), open its details, switch a layer or module, close everything again, and leave the integration.",
			"Repeat with the mobile layout (narrow window).",
		],
		pass: "Focus is always visible and never fully hidden, focus never gets stuck, and long lists or the whole integration can be skipped.",
	},
	{
		id: "MAN-VIS-05",
		title: "Reflow and text spacing in opened states",
		wcag: ["1.4.10", "1.4.12"],
		features: [],
		steps: [
			"At 320 CSS px width (or 400 % zoom at 1280 px), open details, dialogs, filters and menus.",
			"Apply a text-spacing bookmarklet and repeat.",
		],
		pass: "No horizontal scrolling outside the map and no clipped text or controls in any state.",
	},
	{
		id: "MAN-VIS-01",
		title: "Controls, focus indicators and map symbols have 3:1 non-text contrast",
		wcag: ["1.4.11"],
		features: [],
		steps: [
			"Measure with a colour picker (e.g. CCA): control borders/backgrounds against neighbours, focus indicators, selected states, map markers against the base map.",
		],
		pass: "All required boundaries, states and focus indicators reach 3:1.",
	},
	{
		id: "MAN-VIS-02",
		title: "Colour is not the only way to tell things apart",
		wcag: ["1.4.1"],
		features: [],
		steps: [
			"View the integration in greyscale (DevTools › Rendering › Emulate vision deficiencies › Achromatopsia).",
			"Compare categories, live status (free/full, open/closed), selected/unselected and link text.",
		],
		pass: "Each distinction is still recognisable through text, shape, icon or pattern.",
	},
	{
		id: "MAN-VIS-03",
		title: "Browser zoom to 200 % loses no content or function",
		wcag: ["1.4.4"],
		features: [],
		steps: [
			"At 1280 px window width, zoom the browser to 200 %.",
			"Use search, list, details and layer controls.",
		],
		pass: "No text is cut off or overlaps, and every control is still usable.",
	},
	{
		id: "MAN-VIS-04",
		title: "Text over the map and over images has 4.5:1 contrast",
		wcag: ["1.4.3"],
		features: ["map"],
		steps: [
			"Check labels, attribution, badges and buttons that sit on the map canvas or images, at several map positions (dark/aerial base layers too).",
		],
		pass: "Text keeps 4.5:1 (3:1 for large text) against every background it can appear on.",
	},
	{
		id: "MAN-HOV-01",
		title: "Tooltips and hover content can be dismissed, hovered and stay visible",
		wcag: ["1.4.13"],
		features: [],
		steps: [
			"Hover and focus controls that show tooltips or popovers.",
			"Press Escape; move the pointer onto the tooltip; wait.",
		],
		pass: "Escape hides it without moving focus, the pointer can move onto it, and it stays until dismissed or focus/hover leaves.",
	},
	{
		id: "MAN-PTR-01",
		title: "Dragging has a single-pointer alternative",
		wcag: ["2.5.7"],
		features: ["map", "details"],
		steps: [
			"Find every drag interaction (map pan, bottom sheet, sliders, reordering).",
			"Look for buttons or taps that achieve the same.",
		],
		pass: "Each drag result is reachable without dragging (pan buttons/search/list for the map, tap targets for the sheet).",
	},
	{
		id: "MAN-PTR-02",
		title: "Multi-touch gestures have single-pointer alternatives",
		wcag: ["2.5.1"],
		features: ["map"],
		steps: ["On a touch device, check pinch-zoom and rotate."],
		pass: "Zoom buttons (and a rotation reset, if rotation is possible) exist.",
	},
	{
		id: "MAN-PTR-03",
		title: "Pointer down does not trigger actions",
		wcag: ["2.5.2"],
		features: [],
		steps: ["Press a control, move the pointer away, release."],
		pass: "Nothing is triggered on press; releasing outside cancels.",
	},
	{
		id: "MAN-ORI-01",
		title: "Works in portrait and landscape",
		wcag: ["1.3.4"],
		features: [],
		steps: ["On a phone, rotate between portrait and landscape."],
		pass: "Content is not locked to one orientation.",
	},
	{
		id: "MAN-TIM-01",
		title: "Automatic updates do not disturb the user",
		wcag: ["2.2.1", "2.2.2", "3.2.1"],
		features: ["live-data"],
		steps: [
			"Leave a view with live data open for 5 minutes while focused in the list and in details.",
		],
		pass: "Refreshes keep focus, scroll position and selection; moving/updating content can be paused or does not run longer than 5 s.",
	},
	{
		id: "MAN-MOT-01",
		title: "No flashing; motion respects reduced-motion settings",
		wcag: ["2.3.1"],
		features: ["map"],
		steps: [
			"Enable 'reduce motion' in the OS.",
			"Select places and switch modules (fly-to animations).",
		],
		pass: "Nothing flashes more than 3 times per second; fly-to animations are shortened or replaced by a jump (2.3.3 AAA, recommended).",
	},
	{
		id: "MAN-CTX-01",
		title: "Focus and input do not change context unexpectedly",
		wcag: ["3.2.1", "3.2.2"],
		features: [],
		steps: [
			"Tab through all controls; change selects, checkboxes and filters.",
		],
		pass: "No navigation, new window or focus jump happens on focus or on changing a value, unless announced beforehand.",
	},
	{
		id: "MAN-CON-01",
		title: "Consistent navigation, naming and help across integrations",
		wcag: ["3.2.3", "3.2.4", "3.2.6"],
		features: [],
		steps: [
			"Compare this integration with the other audited targets: order of chrome, names of the same functions, place of help/contact.",
		],
		pass: "Repeated components appear in the same relative order with the same names; help (if offered) is in the same place.",
	},
	{
		id: "MAN-TXT-01",
		title: "Headings and labels describe their purpose; instructions do not rely on sensory characteristics",
		wcag: ["2.4.6", "1.3.3", "2.5.3"],
		features: [],
		steps: [
			"Read all headings, labels and instructions.",
			"Check that visible labels are contained in the accessible names (voice control: say 'click <label>').",
		],
		pass: "Headings and labels are descriptive; no 'click the red button on the right'; visible label text starts the accessible name.",
	},
	{
		id: "MAN-SEQ-01",
		title: "Reading order matches the visual order",
		wcag: ["1.3.2", "2.4.3"],
		features: [],
		steps: [
			"Compare the tab order table in the report and the screen reader reading order with the layout (desktop and mobile).",
		],
		pass: "The order is logical; overlays and sheets come right after their trigger or receive focus.",
	},
	{
		id: "MAN-TTL-01",
		title: "Page title reflects the current view",
		wcag: ["2.4.2"],
		features: [],
		steps: ["Switch modules/views and open a place via its URL."],
		pass: "The document title names the site and the current view or place.",
	},
	{
		id: "MAN-WAY-01",
		title: "More than one way to find a place",
		wcag: ["2.4.5"],
		features: ["map"],
		steps: ["Check search, list, categories and links from content pages."],
		pass: "At least two ways lead to a place (e.g. search and list).",
	},
	{
		id: "MAN-FRM-01",
		title: "Form input: labels, purpose, errors and suggestions",
		wcag: ["1.3.5", "3.3.1", "3.3.2", "3.3.3", "3.3.4", "3.3.7", "3.3.8"],
		features: ["form", "search"],
		steps: [
			"Fill in the search or the position input with valid, invalid and empty values.",
			"Submit; repeat a step that asks for the same data.",
		],
		pass: "Fields are labelled (with autocomplete where a purpose applies), errors are identified in text with a suggestion, and nothing has to be entered twice or solved as a puzzle.",
	},
	{
		id: "MAN-MED-01",
		title: "Audio, video and live media",
		wcag: ["1.2.1", "1.2.2", "1.2.3", "1.2.4", "1.2.5", "1.4.2"],
		features: [],
		steps: [
			"Look for audio/video (e.g. webcams, tour audio) in the integration and in details.",
		],
		pass: "No media, or media with captions/alternatives and no auto-playing audio (otherwise fail with details).",
	},
	{
		id: "MAN-IMG-01",
		title: "No images of text; icons have text alternatives",
		wcag: ["1.4.5", "1.1.1"],
		features: [],
		steps: [
			"Inspect logos, legends, badges and map icons used in lists and details.",
		],
		pass: "Text is real text (logos excepted); meaningful icons have alternatives, decorative ones are hidden.",
	},
	{
		id: "MAN-MOV-01",
		title: "No motion actuation",
		wcag: ["2.5.4"],
		features: [],
		steps: [
			"Shake/tilt the device; check for compass or device-orientation features.",
		],
		pass: "No function is triggered by device motion only (or it can be disabled and has a UI alternative).",
	},
	{
		id: "MAN-TGT-01",
		title: "Pointer targets are at least 24 × 24 CSS px or well spaced",
		wcag: ["2.5.8"],
		features: [],
		steps: [
			"On a phone-sized viewport, measure small controls (map buttons, pills, list actions, close buttons) in DevTools.",
		],
		pass: "Each target is at least 24 × 24 CSS px, or a 24 px circle centred on it does not overlap another target (inline links in text excepted).",
	},
	{
		id: "MAN-LNG-01",
		title: "Page language and language of parts",
		wcag: ["3.1.1", "3.1.2"],
		features: [],
		steps: [
			"Check `<html lang>` on the page and on standalone app shells.",
			"Listen to the integration with a screen reader set to auto-switch languages; note mispronounced English labels.",
		],
		pass: "The page language is set correctly and UI text is in that language (or marked with `lang`).",
	},
	{
		id: "MAN-INS-01",
		title: "Install prompt / app banner is accessible",
		wcag: ["2.1.1", "2.4.3", "4.1.2"],
		features: ["install"],
		steps: [
			"Trigger the install invitation or help on a phone and on desktop.",
			"Operate it with keyboard and screen reader.",
		],
		pass: "It is announced, operable, closable with Escape/close button, and focus returns afterwards.",
	},
];

export function manualTestsFor(features: TargetFeature[]): ManualTest[] {
	return MANUAL_TESTS.filter(
		(test) =>
			test.features.length === 0 ||
			test.features.some((feature) => features.includes(feature)),
	);
}

export function manualTestsBySc(): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const test of MANUAL_TESTS) {
		for (const sc of test.wcag) {
			map.set(sc, [...(map.get(sc) ?? []), test.id]);
		}
	}
	return map;
}
