import {act, cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
import type {AsyncStatusView} from "../../lib/async-status";
import {NonReplaceableAsyncStatusRegion as AsyncStatusRegion} from "./AsyncStatusRegion";

const pending: AsyncStatusView<string[]> = {
	status: "pending",
	fetchStatus: "fetching",
	data: undefined,
	error: null,
};

const empty: AsyncStatusView<string[]> = {
	status: "success",
	fetchStatus: "idle",
	data: [],
	error: null,
};

const loaded: AsyncStatusView<string[]> = {
	status: "success",
	fetchStatus: "idle",
	data: ["a"],
	error: null,
};

afterEach(() => {
	cleanup();
	vi.useRealTimers();
	setDocumentLanguage("de");
});

describe("AsyncStatusRegion", () => {
	it("keeps one status live region mounted while messages change", () => {
		vi.useFakeTimers();
		setDocumentLanguage("en");

		const {rerender} = render(
			<AsyncStatusRegion
				emptyMessage={<p>Nothing here</p>}
				view={pending}
			>
				<p>content</p>
			</AsyncStatusRegion>,
		);

		const status = screen.getByRole("status");
		expect(status.textContent).toBe("");

		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(screen.getByRole("status")).toBe(status);
		expect(status.textContent).toBe("Loading…");

		rerender(
			<AsyncStatusRegion emptyMessage={<p>Nothing here</p>} view={empty}>
				<p>content</p>
			</AsyncStatusRegion>,
		);
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(screen.getByRole("status")).toBe(status);
		expect(status.textContent).toBe("Nothing here");

		rerender(
			<AsyncStatusRegion emptyMessage={<p>Nothing here</p>} view={loaded}>
				<p>content</p>
			</AsyncStatusRegion>,
		);
		expect(screen.getByRole("status")).toBe(status);
		expect(status.textContent).toBe("");
		expect(screen.getByText("content")).toBeTruthy();
	});

	it("does not mark the live region's ancestors busy while loading", () => {
		vi.useFakeTimers();

		const {container} = render(<AsyncStatusRegion view={pending} />);
		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(container.querySelector("[aria-busy='true']")).toBeNull();
		expect(screen.getByRole("status").querySelector("[role]")).toBeNull();
	});

	it("reports errors as an assertive alert", () => {
		render(
			<AsyncStatusRegion
				errorMessage="Could not load list."
				view={{
					status: "error",
					fetchStatus: "idle",
					data: undefined,
					error: new Error("nope"),
				}}
			/>,
		);

		const alert = screen.getByRole("alert");
		expect(alert.textContent).toContain("Could not load list.");
		expect(alert.hasAttribute("aria-live")).toBe(false);
	});
});
