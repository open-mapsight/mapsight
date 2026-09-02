import {afterEach, describe, expect, it} from "vitest";

import {
	applyInert,
	collectInertTargets,
	isExemptFromInert,
	restoreInert,
} from "./inert-outside";

describe("isExemptFromInert", () => {
	it("exempts dialogs, react-modal portals, and live regions", () => {
		const dialog = document.createElement("dialog");
		const portal = document.createElement("div");
		portal.className = "ReactModalPortal";
		const marked = document.createElement("div");
		marked.setAttribute("data-ms3-portal", "");
		const live = document.createElement("div");
		live.setAttribute("aria-live", "polite");
		const status = document.createElement("div");
		status.setAttribute("role", "status");
		const host = document.createElement("header");

		expect(isExemptFromInert(dialog)).toBe(true);
		expect(isExemptFromInert(portal)).toBe(true);
		expect(isExemptFromInert(marked)).toBe(true);
		expect(isExemptFromInert(live)).toBe(true);
		expect(isExemptFromInert(status)).toBe(true);
		expect(isExemptFromInert(document.createElement("script"))).toBe(true);
		expect(isExemptFromInert(host)).toBe(false);
	});
});

describe("collectInertTargets / applyInert", () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it("marks host siblings and leaves the overlay and exempt portals alone", () => {
		const header = document.createElement("header");
		header.textContent = "site";
		const alreadyInert = document.createElement("aside");
		alreadyInert.setAttribute("inert", "");
		const portal = document.createElement("div");
		portal.className = "ReactModalPortal";
		const root = document.createElement("div");
		const overlay = document.createElement("div");
		root.append(overlay);

		document.body.append(header, alreadyInert, portal, root);

		const targets = collectInertTargets(overlay);
		expect(targets).toContain(header);
		expect(targets).not.toContain(portal);
		expect(targets).not.toContain(alreadyInert);
		expect(targets).not.toContain(overlay);

		applyInert(targets);
		expect(header.hasAttribute("inert")).toBe(true);
		expect(portal.hasAttribute("inert")).toBe(false);

		restoreInert(targets);
		expect(header.hasAttribute("inert")).toBe(false);
		expect(alreadyInert.hasAttribute("inert")).toBe(true);
	});
});
