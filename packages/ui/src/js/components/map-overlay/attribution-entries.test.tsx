import {renderToString} from "react-dom/server";

import {cleanup, render} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {FutureFlagsContext} from "../../future/context";
import type {FutureFlags} from "../../types";
import AttributionEntries from "./attribution-entries";

afterEach(cleanup);

const INJECTION = "<img src=x onerror=alert(1)>";

function renderEntries(
	attributions: React.ComponentProps<
		typeof AttributionEntries
	>["attributions"],
	future: FutureFlags = {},
) {
	return render(
		<FutureFlagsContext.Provider value={future}>
			<AttributionEntries attributions={attributions} />
		</FutureFlagsContext.Provider>,
	);
}

describe("AttributionEntries", () => {
	it("renders attribution as HTML by default", () => {
		const {container} = renderEntries({
			a: {text: 'Data by <a href="https://example.org/">Example</a>'},
		});
		const link = container.querySelector(".ms3-attribution__entry a");
		expect(link?.getAttribute("href")).toBe("https://example.org/");
		expect(link?.textContent).toBe("Example");
	});

	it("renders attribution as HTML when the flag is false", () => {
		const {container} = renderEntries(
			{a: {text: "<b>bold</b>"}},
			{v8_attributionText: false},
		);
		expect(
			container.querySelector(".ms3-attribution__entry b"),
		).not.toBeNull();
	});

	it("renders attribution as plain text with v8_attributionText", () => {
		const {container} = renderEntries(
			{a: {text: INJECTION}, b: {text: "Fish &amp; <b>Chips</b>"}},
			{v8_attributionText: true},
		);
		const entries = container.querySelectorAll(".ms3-attribution__entry");
		expect(entries).toHaveLength(2);
		expect(entries[0]?.textContent).toBe(INJECTION);
		expect(entries[1]?.textContent).toBe("Fish &amp; <b>Chips</b>");
		expect(container.querySelector("img")).toBeNull();
		expect(container.querySelector("b")).toBeNull();
	});

	it("renders the HTML field as HTML with and without the flag", () => {
		for (const future of [{}, {v8_attributionText: true}]) {
			const {container, unmount} = renderEntries(
				{a: {html: 'By <a href="https://example.org/">Example</a>'}},
				future,
			);
			const link = container.querySelector(".ms3-attribution__entry a");
			expect(link?.getAttribute("href")).toBe("https://example.org/");
			unmount();
		}
	});

	it("renders the HTML field when both fields are set", () => {
		for (const future of [{}, {v8_attributionText: true}]) {
			const {container, unmount} = renderEntries(
				{a: {text: "Plain form", html: "<em>HTML form</em>"}},
				future,
			);
			const entry = container.querySelector(".ms3-attribution__entry");
			expect(entry?.querySelector("em")?.textContent).toBe("HTML form");
			expect(entry?.textContent).toBe("HTML form");
			unmount();
		}
	});

	it("renders plain string entries as HTML with and without the flag", () => {
		for (const future of [{}, {v8_attributionText: true}]) {
			const {container, unmount} = renderEntries(
				{a: "<b>Legend</b>"},
				future,
			);
			expect(container.querySelector("b")?.textContent).toBe("Legend");
			unmount();
		}
	});

	it("treats an empty HTML field as not set", () => {
		const {container} = renderEntries(
			{a: {text: INJECTION, html: ""}},
			{v8_attributionText: true},
		);
		const entry = container.querySelector(".ms3-attribution__entry");
		expect(entry?.textContent).toBe(INJECTION);
		expect(container.querySelector("img")).toBeNull();
	});

	it("leaves no markup behind when the flag is switched on for the same entry", () => {
		const attributions = {a: {text: INJECTION}};
		const {container, rerender} = render(
			<FutureFlagsContext.Provider value={{}}>
				<AttributionEntries attributions={attributions} />
			</FutureFlagsContext.Provider>,
		);
		expect(container.querySelector("img")).not.toBeNull();

		rerender(
			<FutureFlagsContext.Provider value={{v8_attributionText: true}}>
				<AttributionEntries attributions={attributions} />
			</FutureFlagsContext.Provider>,
		);
		expect(container.querySelector("img")).toBeNull();
		expect(
			container.querySelector(".ms3-attribution__entry")?.textContent,
		).toBe(INJECTION);
	});

	it("leaves no markup behind when the HTML field is removed from an entry", () => {
		const future = {v8_attributionText: true};
		const {container, rerender} = render(
			<FutureFlagsContext.Provider value={future}>
				<AttributionEntries
					attributions={{
						a: {text: INJECTION, html: "<b>Trusted</b>"},
					}}
				/>
			</FutureFlagsContext.Provider>,
		);
		expect(container.querySelector("b")).not.toBeNull();

		rerender(
			<FutureFlagsContext.Provider value={future}>
				<AttributionEntries attributions={{a: {text: INJECTION}}} />
			</FutureFlagsContext.Provider>,
		);
		expect(container.querySelector("b")).toBeNull();
		expect(container.querySelector("img")).toBeNull();
		expect(
			container.querySelector(".ms3-attribution__entry")?.textContent,
		).toBe(INJECTION);
	});

	it("escapes attribution text in server-rendered markup with the flag", () => {
		const markup = renderToString(
			<FutureFlagsContext.Provider value={{v8_attributionText: true}}>
				<AttributionEntries attributions={{a: {text: INJECTION}}} />
			</FutureFlagsContext.Provider>,
		);
		expect(markup).not.toContain("<img");
		expect(markup).toContain("&lt;img");
	});

	it("renders children as an additional entry", () => {
		const {container} = render(
			<AttributionEntries attributions={{a: {text: "A"}}}>
				<span id="extra" />
			</AttributionEntries>,
		);
		expect(
			container.querySelector(
				".ms3-attribution__entry--additional #extra",
			),
		).not.toBeNull();
	});
});
