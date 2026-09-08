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

	it("is true for a native dialog rendered inside the overlay chrome", () => {
		const chrome = document.createElement("div");
		const dialog = document.createElement("dialog");
		dialog.setAttribute("open", "");
		chrome.append(dialog);
		document.body.append(chrome);

		expect(isNestedPlatformModalOpen(chrome)).toBe(true);
	});

	it("is true for a react-modal overlay rendered inside the overlay chrome", () => {
		const chrome = document.createElement("div");
		const overlay = document.createElement("div");
		overlay.className = "ReactModal__Overlay";
		chrome.append(overlay);
		document.body.append(chrome);

		expect(isNestedPlatformModalOpen(chrome)).toBe(true);
	});

	it("is true for react-modal content inside an in-chrome overlay provider", () => {
		const chrome = document.createElement("div");
		const provider = document.createElement("div");
		provider.setAttribute("data-overlay-container", "");
		const content = document.createElement("div");
		content.className = "ReactModal__Content";
		content.setAttribute("role", "dialog");
		provider.append(content);
		chrome.append(provider);
		document.body.append(chrome);

		expect(isNestedPlatformModalOpen(chrome)).toBe(true);
	});

	it("is true for a react-modal overlay", () => {
		const overlay = document.createElement("div");
		overlay.className = "ReactModal__Overlay";
		document.body.append(overlay);

		expect(isNestedPlatformModalOpen()).toBe(true);
	});

	it("is true for a react-aria overlay dialog outside the chrome", () => {
		const chrome = document.createElement("div");
		const insideProvider = document.createElement("div");
		insideProvider.setAttribute("data-overlay-container", "");
		chrome.append(insideProvider);

		const portal = document.createElement("div");
		portal.setAttribute("data-overlay-container", "");
		const dialog = document.createElement("div");
		dialog.setAttribute("role", "dialog");
		portal.append(dialog);

		document.body.append(chrome, portal);

		expect(isNestedPlatformModalOpen(chrome)).toBe(true);
	});

	it("is true for a react-aria alert dialog outside the chrome", () => {
		const chrome = document.createElement("div");
		const portal = document.createElement("div");
		portal.setAttribute("data-overlay-container", "");
		const dialog = document.createElement("div");
		dialog.setAttribute("role", "alertdialog");
		portal.append(dialog);

		document.body.append(chrome, portal);

		expect(isNestedPlatformModalOpen(chrome)).toBe(true);
	});

	it("ignores react-aria overlay providers that live inside the chrome", () => {
		const chrome = document.createElement("div");
		const insideProvider = document.createElement("div");
		insideProvider.setAttribute("data-overlay-container", "");
		const dialog = document.createElement("div");
		dialog.setAttribute("role", "dialog");
		insideProvider.append(dialog);
		chrome.append(insideProvider);
		document.body.append(chrome);

		expect(isNestedPlatformModalOpen(chrome)).toBe(false);
	});

	it("ignores in-chrome react-aria alert dialogs", () => {
		const chrome = document.createElement("div");
		const insideProvider = document.createElement("div");
		insideProvider.setAttribute("data-overlay-container", "");
		const dialog = document.createElement("div");
		dialog.setAttribute("role", "alertdialog");
		insideProvider.append(dialog);
		chrome.append(insideProvider);
		document.body.append(chrome);

		expect(isNestedPlatformModalOpen(chrome)).toBe(false);
	});
});
