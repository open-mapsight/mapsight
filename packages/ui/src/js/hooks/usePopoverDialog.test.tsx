import {createRef} from "react";

import {cleanup, render, renderHook, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import usePopoverDialog from "./usePopoverDialog";

vi.mock("react-aria", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		useOverlay: () => ({
			overlayProps: {"data-overlay": "true"},
		}),
		useDialog: (props: Record<string, unknown> = {}) => ({
			dialogProps: {
				role: "dialog",
				...(props["aria-label"] != null
					? {"aria-label": props["aria-label"]}
					: {}),
				...(props["aria-labelledby"] != null
					? {"aria-labelledby": props["aria-labelledby"]}
					: {}),
			},
			titleProps: {id: "title"},
		}),
		useOverlayPosition: () => ({
			overlayProps: {style: {position: "absolute" as const}},
			placement: "bottom",
			arrowProps: {},
			updatePosition: vi.fn(),
		}),
		mergeProps: (...args: Array<Record<string, unknown>>) =>
			Object.assign({}, ...args) as Record<string, unknown>,
	};
});

describe("usePopoverDialog", () => {
	afterEach(() => {
		cleanup();
	});

	it("merges overlay, position, and dialog props onto the popover", () => {
		const triggerRef = createRef<HTMLButtonElement>();
		const popoverRef = createRef<HTMLDivElement>();
		const {result} = renderHook(() =>
			usePopoverDialog({
				isOpen: true,
				onClose: vi.fn(),
				triggerRef,
				popoverRef,
				popoverId: "opts",
			}),
		);

		render(
			<div
				ref={popoverRef}
				{...result.current.popoverProps}
				data-testid="panel"
			/>,
		);

		const panel = screen.getByTestId("panel");
		expect(panel.getAttribute("data-overlay")).toBe("true");
		expect(panel.getAttribute("role")).toBe("dialog");
		expect(panel.getAttribute("id")).toBe("opts");
		expect(panel.style.position).toBe("absolute");
	});

	it("exposes trigger aria props tied to open state", () => {
		const triggerRef = createRef<HTMLButtonElement>();
		const popoverRef = createRef<HTMLDivElement>();
		const {result, rerender} = renderHook(
			({isOpen}: {isOpen: boolean}) =>
				usePopoverDialog({
					isOpen,
					onClose: vi.fn(),
					triggerRef,
					popoverRef,
					popoverId: "opts",
				}),
			{initialProps: {isOpen: false}},
		);

		expect(result.current.triggerAriaProps).toEqual({
			"aria-expanded": false,
			"aria-haspopup": "dialog",
		});

		rerender({isOpen: true});
		expect(result.current.triggerAriaProps).toEqual({
			"aria-expanded": true,
			"aria-haspopup": "dialog",
			"aria-controls": "opts",
		});
	});

	it("threads aria-label and labelledBy through useDialog", () => {
		const triggerRef = createRef<HTMLButtonElement>();
		const popoverRef = createRef<HTMLDivElement>();
		const {result, rerender} = renderHook(
			({
				labelledBy,
				ariaLabel,
			}: {
				labelledBy?: string;
				ariaLabel?: string;
			}) =>
				usePopoverDialog({
					isOpen: true,
					onClose: vi.fn(),
					triggerRef,
					popoverRef,
					labelledBy,
					"aria-label": ariaLabel,
				}),
			{initialProps: {ariaLabel: "Filters"}},
		);

		expect(result.current.popoverProps["aria-label"]).toBe("Filters");

		rerender({labelledBy: "external-title"});
		expect(result.current.popoverProps["aria-labelledby"]).toBe(
			"external-title",
		);
	});
});
