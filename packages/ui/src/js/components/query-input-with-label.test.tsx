import {type ReactNode, useState} from "react";

import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {FutureFlagsContext} from "../future/context";
import {setDocumentLanguage} from "../helpers/i18n";
import type {FutureFlags} from "../types";
import QueryInputWithLabel from "./query-input-with-label";

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

const LABEL = "In Liste suchen …";

function Harness({
	initialQuery = "",
	future,
	onChange,
}: {
	initialQuery?: string;
	future?: FutureFlags;
	onChange?: (query: string) => void;
}) {
	const [query, setQuery] = useState(initialQuery);
	const input = (
		<QueryInputWithLabel
			label={LABEL}
			query={query}
			onChange={(next) => {
				setQuery(next);
				onChange?.(next);
			}}
		/>
	);

	return future ? (
		<FutureFlagsContext.Provider value={future}>
			{input}
		</FutureFlagsContext.Provider>
	) : (
		input
	);
}

function withListSearchButton(children: ReactNode) {
	return (
		<FutureFlagsContext.Provider value={{v8_listSearchButton: true}}>
			{children}
		</FutureFlagsContext.Provider>
	);
}

describe("QueryInputWithLabel", () => {
	it("keeps a visible label and searchbox when the future flag is off", () => {
		render(<Harness />);

		const input = screen.getByRole("searchbox");
		expect(input).toBeTruthy();
		expect(screen.getByText(LABEL).className).toContain(
			"ms3-query-input-with-label__label",
		);
		expect(screen.getByText(LABEL).className).not.toContain(
			"ms3-visuallyhidden",
		);
		expect(screen.queryByRole("button", {name: LABEL})).toBeNull();
		expect(
			document.querySelector(
				".ms3-query-input-with-label--list-search-button",
			),
		).toBeNull();
	});

	it("forwards typed text through onChange without opening a button", () => {
		const onChange = vi.fn();
		render(<Harness onChange={onChange} />);

		fireEvent.change(screen.getByRole("searchbox"), {
			target: {value: "markt"},
		});

		expect(onChange).toHaveBeenCalledWith("markt");
	});
});

describe("QueryInputWithLabel with v8_listSearchButton", () => {
	it("renders a labeled open button when the query is empty", () => {
		render(<Harness future={{v8_listSearchButton: true}} />);

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
		expect(
			document.querySelector(
				".ms3-query-input-with-label--list-search-button",
			),
		).not.toBeNull();
	});

	it("starts expanded when the query is already non-empty", () => {
		render(
			<Harness
				initialQuery="cafe"
				future={{v8_listSearchButton: true}}
			/>,
		);

		expect(screen.getByRole("searchbox")).toBeTruthy();
		expect(screen.queryByRole("button", {name: LABEL})).toBeNull();
		expect(document.activeElement).not.toBe(screen.getByRole("searchbox"));
	});

	it("replaces the button with a focused input in the same icon host", () => {
		const {container} = render(
			<Harness future={{v8_listSearchButton: true}} />,
		);
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
		render(<Harness future={{v8_listSearchButton: true}} />);

		fireEvent.click(screen.getByRole("button", {name: LABEL}));
		expect(screen.getByRole("searchbox")).toBeTruthy();
		expect(document.activeElement).toBe(screen.getByRole("searchbox"));
	});

	it("stays expanded after the query is cleared while the input remains focused", () => {
		render(
			<Harness
				initialQuery="cafe"
				future={{v8_listSearchButton: true}}
			/>,
		);

		fireEvent.blur(screen.getByRole("searchbox"));
		fireEvent.focus(screen.getByRole("searchbox"));
		fireEvent.change(screen.getByRole("searchbox"), {
			target: {value: ""},
		});

		expect(screen.getByRole("searchbox")).toBeTruthy();
		expect(screen.queryByRole("button", {name: LABEL})).toBeNull();
	});

	it("collapses on blur when the query is empty", () => {
		render(<Harness future={{v8_listSearchButton: true}} />);

		fireEvent.click(screen.getByRole("button", {name: LABEL}));
		fireEvent.blur(screen.getByRole("searchbox"));

		expect(screen.getByRole("button", {name: LABEL})).toBeTruthy();
		expect(screen.queryByRole("searchbox")).toBeNull();
	});

	it("stays expanded on blur when the query is non-empty", () => {
		render(
			<Harness
				initialQuery="cafe"
				future={{v8_listSearchButton: true}}
			/>,
		);

		fireEvent.blur(screen.getByRole("searchbox"));

		expect(screen.getByRole("searchbox")).toBeTruthy();
		expect(screen.queryByRole("button", {name: LABEL})).toBeNull();
	});

	it("collapses an empty input on Escape", () => {
		render(<Harness future={{v8_listSearchButton: true}} />);

		fireEvent.click(screen.getByRole("button", {name: LABEL}));
		fireEvent.keyDown(screen.getByRole("searchbox"), {key: "Escape"});

		expect(screen.getByRole("button", {name: LABEL})).toBeTruthy();
		expect(screen.queryByRole("searchbox")).toBeNull();
	});

	it("does not collapse on Escape when the query is non-empty", () => {
		render(
			<Harness
				initialQuery="cafe"
				future={{v8_listSearchButton: true}}
			/>,
		);

		fireEvent.keyDown(screen.getByRole("searchbox"), {key: "Escape"});

		expect(screen.getByRole("searchbox")).toBeTruthy();
	});

	it("keeps the input focused after reset so the control stays expanded", () => {
		setDocumentLanguage("de");
		render(
			<Harness
				initialQuery="cafe"
				future={{v8_listSearchButton: true}}
			/>,
		);

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
			withListSearchButton(
				<QueryInputWithLabel
					label={LABEL}
					query=""
					onChange={onChange}
				/>,
			),
		);

		fireEvent.click(screen.getByRole("button", {name: LABEL}));
		fireEvent.change(screen.getByRole("searchbox"), {
			target: {value: "markt"},
		});

		expect(onChange).toHaveBeenCalledWith("markt");
	});
});
