import {afterEach, describe, expect, it} from "vitest";

import {
	alignFlatpickrCalendar,
	alignFlatpickrInstance,
	bindFlatpickrViewportAlignment,
} from "./flatpickr-position.js";

function mockRect(
	element: HTMLElement,
	rect: Pick<
		DOMRect,
		"left" | "top" | "right" | "bottom" | "width" | "height"
	>,
): void {
	element.getBoundingClientRect = () => {
		const box = {
			x: rect.left,
			y: rect.top,
			...rect,
		};
		return {
			...box,
			toJSON() {
				return box;
			},
		};
	};
}

function mockBox(element: HTMLElement, width: number, height: number): void {
	Object.defineProperty(element, "offsetWidth", {
		configurable: true,
		value: width,
	});
	Object.defineProperty(element, "offsetHeight", {
		configurable: true,
		value: height,
	});
}

describe("alignFlatpickrCalendar", () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it("pins the calendar to the input with viewport coordinates", () => {
		const input = document.createElement("input");
		const calendar = document.createElement("div");
		document.body.append(input, calendar);
		Object.defineProperty(window, "innerHeight", {
			configurable: true,
			value: 768,
		});
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1440,
		});
		mockRect(input, {
			left: 676,
			top: 536,
			right: 788,
			bottom: 564,
			width: 112,
			height: 28,
		});
		mockBox(calendar, 308, 296);

		alignFlatpickrCalendar(calendar, input);

		expect(calendar.style.position).toBe("fixed");
		expect(calendar.style.left).toBe("676px");
		expect(calendar.style.right).toBe("auto");
		expect(calendar.style.top).toBe("238px");
	});

	it("does not add a positioned ancestor's document offset", () => {
		const input = document.createElement("input");
		const calendar = document.createElement("div");
		document.body.append(input, calendar);
		mockRect(input, {
			left: 420,
			top: 200,
			right: 532,
			bottom: 228,
			width: 112,
			height: 28,
		});
		mockBox(calendar, 308, 80);

		alignFlatpickrCalendar(calendar, input);

		expect(calendar.style.left).toBe("420px");
		expect(calendar.style.top).toBe("230px");
	});

	it("shifts left when the calendar would overflow the viewport", () => {
		const input = document.createElement("input");
		const calendar = document.createElement("div");
		document.body.append(input, calendar);
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 800,
		});
		mockRect(input, {
			left: 700,
			top: 200,
			right: 812,
			bottom: 228,
			width: 112,
			height: 28,
		});
		mockBox(calendar, 308, 80);

		alignFlatpickrCalendar(calendar, input);

		expect(calendar.style.left).toBe("504px");
	});

	it("uses the visible alt input on a flatpickr instance", () => {
		const hidden = document.createElement("input");
		const alt = document.createElement("input");
		const calendar = document.createElement("div");
		document.body.append(hidden, alt, calendar);
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1440,
		});
		mockRect(hidden, {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
			width: 0,
			height: 0,
		});
		mockRect(alt, {
			left: 676,
			top: 200,
			right: 788,
			bottom: 228,
			width: 112,
			height: 28,
		});
		mockBox(calendar, 308, 80);

		alignFlatpickrInstance({
			calendarContainer: calendar,
			altInput: alt,
			_input: hidden,
		});

		expect(calendar.style.left).toBe("676px");
	});
});

describe("bindFlatpickrViewportAlignment", () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it("re-applies viewport alignment after Flatpickr writes document coordinates", () => {
		const input = document.createElement("input");
		const calendar = document.createElement("div");
		document.body.append(input, calendar);
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1440,
		});
		mockRect(input, {
			left: 676,
			top: 200,
			right: 788,
			bottom: 228,
			width: 112,
			height: 28,
		});
		mockBox(calendar, 308, 80);

		const instance: {
			calendarContainer: HTMLDivElement;
			altInput: HTMLInputElement;
			_input: HTMLInputElement;
			_positionCalendar: (customPositionElement?: HTMLElement) => void;
		} = {
			calendarContainer: calendar,
			altInput: input,
			_input: input,
			_positionCalendar() {
				calendar.style.position = "absolute";
				calendar.style.left = "1032px";
				calendar.style.top = "330px";
			},
		};

		bindFlatpickrViewportAlignment(instance);
		instance._positionCalendar();

		expect(calendar.style.position).toBe("fixed");
		expect(calendar.style.left).toBe("676px");
		expect(calendar.style.top).toBe("230px");
	});
});
