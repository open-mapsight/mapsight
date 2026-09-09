import {useState} from "react";

import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../helpers/i18n";
import QueryInputWithLabel from "./query-input-with-label";

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

const LABEL = "In Liste suchen …";

function Harness({initialQuery = ""}: {initialQuery?: string}) {
	const [query, setQuery] = useState(initialQuery);
	return (
		<QueryInputWithLabel label={LABEL} query={query} onChange={setQuery} />
	);
}

describe("QueryInputWithLabel", () => {
	it("renders a labeled open button when the query is empty", () => {
		render(<Harness />);

		const openButton = screen.getByRole("button", {name: LABEL});
		expect(openButton.className).toContain(
			"ms3-query-input-with-label__open",
		);
		expect(
			openButton.querySelector(".ms3-query-input-with-label__open-label")
				?.textContent,
		).toBe(LABEL);
		expect(screen.queryByRole("searchbox")).toBeNull();
		expect(
			document.querySelector(
				".ms3-query-input-with-label__input-container",
			),
		).not.toBeNull();
	});

	it("starts expanded when the query is already non-empty", () => {
		render(<Harness initialQuery="cafe" />);

		expect(screen.getByRole("searchbox")).toBeTruthy();
		expect(screen.queryByRole("button", {name: LABEL})).toBeNull();
		expect(document.activeElement).not.toBe(screen.getByRole("searchbox"));
	});

	it("replaces the button with a focused input in the same icon host", () => {
		const {container} = render(<Harness />);
		const iconHost = container.querySelector(
			".ms3-query-input-with-label__input-container",
		);

		fireEvent.click(screen.getByRole("button", {name: LABEL}));

		const input = screen.getByRole("searchbox");
		expect(input).toBeTruthy();
		expect(screen.queryByRole("button", {name: LABEL})).toBeNull();
		expect(iconHost?.contains(input)).toBe(true);
		expect(document.activeElement).toBe(input);
	});

	it("stays expanded while the input is focused even if the query is empty", () => {
		render(<Harness />);

		fireEvent.click(screen.getByRole("button", {name: LABEL}));
		expect(screen.getByRole("searchbox")).toBeTruthy();
		expect(document.activeElement).toBe(screen.getByRole("searchbox"));
	});

	it("stays expanded after the query is cleared while the input remains focused", () => {
		render(<Harness initialQuery="cafe" />);

		fireEvent.blur(screen.getByRole("searchbox"));
		fireEvent.focus(screen.getByRole("searchbox"));
		fireEvent.change(screen.getByRole("searchbox"), {
			target: {value: ""},
		});

		expect(screen.getByRole("searchbox")).toBeTruthy();
		expect(screen.queryByRole("button", {name: LABEL})).toBeNull();
	});

	it("collapses on blur when the query is empty", () => {
		render(<Harness />);

		fireEvent.click(screen.getByRole("button", {name: LABEL}));
		fireEvent.blur(screen.getByRole("searchbox"));

		expect(screen.getByRole("button", {name: LABEL})).toBeTruthy();
		expect(screen.queryByRole("searchbox")).toBeNull();
	});

	it("stays expanded on blur when the query is non-empty", () => {
		render(<Harness initialQuery="cafe" />);

		fireEvent.blur(screen.getByRole("searchbox"));

		expect(screen.getByRole("searchbox")).toBeTruthy();
		expect(screen.queryByRole("button", {name: LABEL})).toBeNull();
	});

	it("collapses an empty input on Escape", () => {
		render(<Harness />);

		fireEvent.click(screen.getByRole("button", {name: LABEL}));
		fireEvent.keyDown(screen.getByRole("searchbox"), {key: "Escape"});

		expect(screen.getByRole("button", {name: LABEL})).toBeTruthy();
		expect(screen.queryByRole("searchbox")).toBeNull();
	});

	it("does not collapse on Escape when the query is non-empty", () => {
		render(<Harness initialQuery="cafe" />);

		fireEvent.keyDown(screen.getByRole("searchbox"), {key: "Escape"});

		expect(screen.getByRole("searchbox")).toBeTruthy();
	});

	it("keeps the input focused after reset so the control stays expanded", () => {
		setDocumentLanguage("de");
		render(<Harness initialQuery="cafe" />);

		fireEvent.blur(screen.getByRole("searchbox"));
		fireEvent.focus(screen.getByRole("searchbox"));
		fireEvent.click(
			screen.getByRole("button", {name: "Suche zurücksetzen"}),
		);

		expect(screen.getByRole("searchbox")).toBeTruthy();
		expect(screen.getByRole("searchbox").value).toBe("");
		expect(document.activeElement).toBe(screen.getByRole("searchbox"));
		expect(screen.queryByRole("button", {name: LABEL})).toBeNull();
	});

	it("forwards typed text through onChange", () => {
		const onChange = vi.fn();
		render(
			<QueryInputWithLabel label={LABEL} query="" onChange={onChange} />,
		);

		fireEvent.click(screen.getByRole("button", {name: LABEL}));
		fireEvent.change(screen.getByRole("searchbox"), {
			target: {value: "markt"},
		});

		expect(onChange).toHaveBeenCalledWith("markt");
	});
});
