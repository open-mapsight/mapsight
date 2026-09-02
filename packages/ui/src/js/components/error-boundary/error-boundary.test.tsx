import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
import ErrorBoundary from "./error-boundary";

afterEach(cleanup);

beforeEach(() => {
	setDocumentLanguage("en");
});

function Boom({message = "boom"}: {message?: string}) {
	throw new Error(message);
}

let allowRender = false;
function ControlledBoom() {
	if (!allowRender) {
		throw new Error("blocked");
	}
	return <span>recovered</span>;
}

describe("ErrorBoundary", () => {
	it("renders children when nothing throws", () => {
		render(
			<ErrorBoundary>
				<span>ok</span>
			</ErrorBoundary>,
		);

		expect(screen.getByText("ok")).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("replaces the failed subtree and leaves siblings mounted", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		render(
			<div>
				<span>sibling</span>
				<ErrorBoundary>
					<Boom />
				</ErrorBoundary>
			</div>,
		);

		expect(screen.getByText("sibling")).toBeTruthy();
		expect(screen.getByRole("alert").textContent).toContain(
			"This section could not be displayed.",
		);
		expect(screen.queryByText("boom")).toBeNull();

		consoleError.mockRestore();
	});

	it("remounts children after retry", () => {
		allowRender = false;
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		render(
			<ErrorBoundary>
				<ControlledBoom />
			</ErrorBoundary>,
		);

		expect(screen.getByRole("alert")).toBeTruthy();
		allowRender = true;
		fireEvent.click(screen.getByRole("button", {name: "Try again"}));
		expect(screen.getByText("recovered")).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();

		consoleError.mockRestore();
	});

	it("remounts children when resetKeys change", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const {rerender} = render(
			<ErrorBoundary resetKeys={["a"]}>
				<Boom />
			</ErrorBoundary>,
		);

		expect(screen.getByRole("alert")).toBeTruthy();

		rerender(
			<ErrorBoundary resetKeys={["b"]}>
				<span>next</span>
			</ErrorBoundary>,
		);

		expect(screen.getByText("next")).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();

		consoleError.mockRestore();
	});

	it("uses a custom fallback node", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		render(
			<ErrorBoundary fallback={<div>custom down</div>}>
				<Boom />
			</ErrorBoundary>,
		);

		expect(screen.getByText("custom down")).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();

		consoleError.mockRestore();
	});

	it("calls onError with the thrown error", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const onError = vi.fn();

		render(
			<ErrorBoundary onError={onError}>
				<Boom message="reported" />
			</ErrorBoundary>,
		);

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError.mock.calls[0]?.[0]).toMatchObject({message: "reported"});

		consoleError.mockRestore();
	});

	it("applies the overlay variant class", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		render(
			<ErrorBoundary variant="overlay">
				<Boom />
			</ErrorBoundary>,
		);

		expect(screen.getByRole("alert").className).toContain(
			"ms3-error-boundary--overlay",
		);
		expect(screen.getByRole("alert").textContent).toContain(
			"This control failed.",
		);

		consoleError.mockRestore();
	});
});
