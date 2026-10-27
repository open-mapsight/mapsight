import {createRef} from "react";
import {renderToString} from "react-dom/server";

import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {
	Heading,
	HeadingContent,
	HeadingLevel,
	type HeadingRank,
	HeadingsProvider,
} from "./index";

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("automatic headings", () => {
	it("keeps legacy elements when options and scopes are supplied without enabling the flag", () => {
		render(
			<HeadingsProvider
				options={{baseLevel: 4, overrides: {switcher: "h1"}}}
			>
				<HeadingLevel level={5}>
					<Heading headingSlot="switcher" fallbackAs="h3">
						Layers
					</Heading>
					<Heading fallbackAs="h4">Search group</Heading>
				</HeadingLevel>
			</HeadingsProvider>,
		);
		expect(
			screen.getByRole("heading", {name: "Layers", level: 3}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Search group", level: 4}),
		).toBeTruthy();
	});

	it("defaults to h2 and advances within titled content without affecting siblings", () => {
		render(
			<HeadingsProvider enabled>
				<Heading>Section</Heading>
				<HeadingContent headingAs="h2">
					<Heading>Subsection</Heading>
				</HeadingContent>
				<Heading>Sibling</Heading>
				<HeadingLevel level={4}>
					<Heading>Host-composed section</Heading>
				</HeadingLevel>
			</HeadingsProvider>,
		);
		expect(
			screen.getByRole("heading", {name: "Section", level: 2}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Subsection", level: 3}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Sibling", level: 2}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {
				name: "Host-composed section",
				level: 4,
			}),
		).toBeTruthy();
	});

	it("resolves explicit elements before slot overrides and contextual ranks", () => {
		render(
			<HeadingsProvider
				enabled
				options={{baseLevel: 3, overrides: {switcher: "h4"}}}
			>
				<Heading headingSlot="switcher">Configured</Heading>
				<Heading headingSlot="switcher" as="h2">
					Explicit
				</Heading>
				<Heading headingSlot="switcher" as="div">
					Label
				</Heading>
				<HeadingContent headingAs="h4">
					<Heading>Below override</Heading>
				</HeadingContent>
				<HeadingContent headingAs="div">
					<Heading>Below label</Heading>
				</HeadingContent>
			</HeadingsProvider>,
		);
		expect(
			screen.getByRole("heading", {name: "Configured", level: 4}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Explicit", level: 2}),
		).toBeTruthy();
		expect(screen.getByText("Label").tagName).toBe("DIV");
		expect(screen.getByText("Label").hasAttribute("role")).toBe(false);
		expect(
			screen.getByRole("heading", {name: "Below override", level: 5}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Below label", level: 3}),
		).toBeTruthy();
	});

	it("caps native ranks at h6 and forwards ids, refs and native HTML attributes", () => {
		const ref = createRef<HTMLElement>();
		render(
			<HeadingsProvider enabled options={{baseLevel: 6}}>
				<HeadingContent headingAs="h6">
					<Heading ref={ref} id="last-heading" slot="native-slot">
						Deep section
					</Heading>
				</HeadingContent>
			</HeadingsProvider>,
		);
		const heading = screen.getByRole("heading", {
			name: "Deep section",
			level: 6,
		});
		expect(ref.current).toBe(heading);
		expect(heading.id).toBe("last-heading");
		expect(heading.getAttribute("slot")).toBe("native-slot");
	});

	it("resets both levels and overrides at each instance boundary", () => {
		render(
			<HeadingsProvider
				enabled
				options={{baseLevel: 4, overrides: {switcher: "div"}}}
			>
				<Heading>Outer</Heading>
				<HeadingsProvider enabled>
					<Heading headingSlot="switcher">Inner</Heading>
				</HeadingsProvider>
				<HeadingsProvider>
					<Heading headingSlot="switcher" fallbackAs="h3">
						Legacy
					</Heading>
				</HeadingsProvider>
			</HeadingsProvider>,
		);
		expect(
			screen.getByRole("heading", {name: "Outer", level: 4}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Inner", level: 2}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Legacy", level: 3}),
		).toBeTruthy();
	});

	it.each([0, 7, 1.5, NaN])(
		"rejects invalid configured rank %s during server rendering",
		(level) => {
			expect(() =>
				renderToString(
					<HeadingsProvider
						enabled
						options={{baseLevel: level as HeadingRank}}
					>
						<Heading>Invalid</Heading>
					</HeadingsProvider>,
				),
			).toThrow(RangeError);
		},
	);

	it("rejects invalid override elements at the provider boundary", () => {
		expect(() =>
			renderToString(
				<HeadingsProvider
					enabled
					options={{overrides: {switcher: "h7" as "h6"}}}
				>
					<Heading>Invalid</Heading>
				</HeadingsProvider>,
			),
		).toThrow(TypeError);
	});
});
