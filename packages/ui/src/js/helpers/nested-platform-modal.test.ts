import {afterEach, describe, expect, it} from "vitest";

import {isNestedPlatformModalOpen} from "./nested-platform-modal";

describe("isNestedPlatformModalOpen", () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it("is false when only the overlay chrome dialog is present", () => {
		const chrome = document.createElement("div");
		chrome.setAttribute("role", "dialog");
		chrome.setAttribute("aria-modal", "true");
		document.body.append(chrome);

		expect(isNestedPlatformModalOpen(chrome)).toBe(false);
	});

	it("is true for an open native dialog", () => {
		const dialog = document.createElement("dialog");
		dialog.setAttribute("open", "");
		document.body.append(dialog);

		expect(isNestedPlatformModalOpen()).toBe(true);
	});

	it("is true for a react-modal overlay", () => {
		const overlay = document.createElement("div");
		overlay.className = "ReactModal__Overlay";
		document.body.append(overlay);

		expect(isNestedPlatformModalOpen()).toBe(true);
	});
});
