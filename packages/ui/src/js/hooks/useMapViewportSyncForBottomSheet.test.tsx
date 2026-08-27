import {act, cleanup, render} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import useMapViewportSyncForBottomSheet from "./useMapViewportSyncForBottomSheet";

const dispatch = vi.fn();

vi.mock("react-redux", () => ({
	useDispatch: () => dispatch,
}));

vi.mock("@mapsight/core/lib/base/actions", () => ({
	async: (action: unknown) => ({type: "async", action}),
}));

vi.mock("@mapsight/core/lib/map/actions", () => ({
	updateMapSize: (
		controller: string,
		options: {from?: string | null; reCenter?: boolean},
	) => ({
		type: "updateMapSize",
		controller,
		options,
	}),
}));

vi.mock("@mapsight/core/lib/feature-selections/actions", () => ({
	deselectAll: (controller: string, selection: string) => ({
		type: "deselectAll",
		controller,
		selection,
	}),
}));

function HookHarness({
	isOpen,
	syncKey,
	clearSelectionsOnDismiss,
}: {
	isOpen: boolean;
	syncKey?: string | null;
	clearSelectionsOnDismiss?: false | readonly string[];
}) {
	const {syncMapViewport, scheduleMapViewportSync, dismissSelection} =
		useMapViewportSyncForBottomSheet({
			isOpen,
			syncKey,
			clearSelectionsOnDismiss,
		});

	return (
		<div>
			<button type="button" onClick={syncMapViewport}>
				sync
			</button>
			<button type="button" onClick={scheduleMapViewportSync}>
				schedule
			</button>
			<button type="button" onClick={dismissSelection}>
				dismiss
			</button>
		</div>
	);
}

describe("useMapViewportSyncForBottomSheet", () => {
	afterEach(() => {
		cleanup();
		dispatch.mockClear();
		vi.restoreAllMocks();
	});

	it("syncs the map when the sheet opens", () => {
		vi.spyOn(window, "requestAnimationFrame").mockImplementation(
			(callback) => {
				callback(0);
				return 1;
			},
		);

		render(<HookHarness isOpen={true} syncKey="poi-1" />);

		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "async",
				action: expect.objectContaining({
					type: "updateMapSize",
					options: {from: "below", reCenter: true},
				}),
			}),
		);
	});

	it("syncs the map when the sheet closes", () => {
		vi.spyOn(window, "requestAnimationFrame").mockImplementation(
			(callback) => {
				callback(0);
				return 1;
			},
		);

		const {rerender} = render(<HookHarness isOpen={true} />);
		dispatch.mockClear();

		rerender(<HookHarness isOpen={false} />);

		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "async",
				action: expect.objectContaining({
					type: "updateMapSize",
					options: {from: "below", reCenter: true},
				}),
			}),
		);
	});

	it("dismisses highlight, preselect, and select by default", () => {
		const {getByText} = render(<HookHarness isOpen={false} />);

		act(() => {
			getByText("dismiss").click();
		});

		expect(dispatch).toHaveBeenCalledTimes(3);
		const selections = dispatch.mock.calls.map(([action]) => {
			const typed = action as {selection: string};
			return typed.selection;
		});
		expect(selections).toEqual(["highlight", "preselect", "select"]);
	});

	it("can disable selection dismiss", () => {
		const {getByText} = render(
			<HookHarness isOpen={false} clearSelectionsOnDismiss={false} />,
		);

		act(() => {
			getByText("dismiss").click();
		});

		expect(dispatch).not.toHaveBeenCalled();
	});

	it("coalesces scheduled syncs to one frame", () => {
		let frameCallback: FrameRequestCallback | null = null;
		vi.spyOn(window, "requestAnimationFrame").mockImplementation(
			(callback) => {
				frameCallback = callback;
				return 42;
			},
		);

		const {getByText} = render(<HookHarness isOpen={false} />);
		dispatch.mockClear();

		act(() => {
			getByText("schedule").click();
			getByText("schedule").click();
		});

		expect(dispatch).not.toHaveBeenCalled();
		expect(frameCallback).not.toBeNull();

		act(() => {
			frameCallback?.(0);
		});

		expect(dispatch).toHaveBeenCalledTimes(1);
	});
});
