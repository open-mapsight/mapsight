import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage, translate} from "../../helpers/i18n";
import FeatureListCycling from "./feature-list-cycling";

const features = [
	{id: "a", properties: {name: "Castle"}},
	{id: "b", properties: {name: "Museum", listName: "City Museum"}},
	{id: "c"},
];

function renderCycling() {
	const onFeatureSelection = vi.fn();
	render(
		<FeatureListCycling
			filteredFeatures={features}
			selectedFeatureId="b"
			highlightedFeatureId={undefined}
			onFeatureSelection={onFeatureSelection}
			onFeatureHighlight={vi.fn()}
			onFeatureUnHighlight={vi.fn()}
		/>,
	);
	return onFeatureSelection;
}

describe("FeatureListCycling", () => {
	afterEach(() => {
		cleanup();
		setDocumentLanguage("de");
	});

	it("labels the German buttons after their direction", () => {
		setDocumentLanguage("de");
		const onFeatureSelection = renderCycling();

		fireEvent.click(screen.getByRole("button", {name: "Nächster Eintrag"}));
		expect(onFeatureSelection).toHaveBeenLastCalledWith("c");

		fireEvent.click(
			screen.getByRole("button", {name: "Vorheriger Eintrag"}),
		);
		expect(onFeatureSelection).toHaveBeenLastCalledWith("a");
	});

	it("labels the English buttons after their direction", () => {
		setDocumentLanguage("en");
		const onFeatureSelection = renderCycling();

		fireEvent.click(screen.getByRole("button", {name: "next entry"}));
		expect(onFeatureSelection).toHaveBeenLastCalledWith("c");
	});
	it("hides duplicate dots from assistive technology and the tab sequence", () => {
		renderCycling();
		expect(screen.getAllByRole("button")).toHaveLength(2);
		const dots = document.querySelectorAll(".ms3-list-cycling-box__dot");
		expect(dots).toHaveLength(3);
		for (const dot of dots) {
			expect(dot.getAttribute("aria-hidden")).toBe("true");
			expect(dot.getAttribute("tabindex")).toBe("-1");
		}
	});

	it.each(["de", "en"])(
		"updates a polite station status after next/previous, including wraparound, in %s",
		(language) => {
			setDocumentLanguage(language);
			const onFeatureSelection = vi.fn();
			const props = {
				filteredFeatures: features,
				selectedFeatureId: "b",
				highlightedFeatureId: undefined,
				onFeatureSelection,
				onFeatureHighlight: vi.fn(),
				onFeatureUnHighlight: vi.fn(),
			};
			const {rerender} = render(<FeatureListCycling {...props} />);
			const scroller = document.querySelector(
				".ms3-list-cycling-box__dots-scroller",
			) as HTMLElement;
			scroller.scrollTo = vi.fn();
			const status = screen.getByRole("status");
			expect(status.getAttribute("aria-live")).toBe("polite");
			expect(status.getAttribute("aria-atomic")).toBe("true");
			const message = (n: number, name: string) =>
				translate("ui.feature-list.cycling.status")
					.replace("{n}", String(n))
					.replace("{total}", "3")
					.replace("{name}", name);
			expect(status.textContent?.trim()).toBe(message(2, "City Museum"));
			fireEvent.click(
				screen.getByRole("button", {name: translate("nextEntry")}),
			);
			expect(onFeatureSelection).toHaveBeenLastCalledWith("c");
			rerender(<FeatureListCycling {...props} selectedFeatureId="c" />);
			expect(status.textContent?.trim()).toBe(message(3, "c"));
			fireEvent.click(
				screen.getByRole("button", {name: translate("nextEntry")}),
			);
			expect(onFeatureSelection).toHaveBeenLastCalledWith("a");
			rerender(<FeatureListCycling {...props} selectedFeatureId="a" />);
			expect(status.textContent?.trim()).toBe(message(1, "Castle"));
			fireEvent.click(
				screen.getByRole("button", {name: translate("prevEntry")}),
			);
			expect(onFeatureSelection).toHaveBeenLastCalledWith("c");
			rerender(<FeatureListCycling {...props} selectedFeatureId="c" />);
			expect(status.textContent?.trim()).toBe(message(3, "c"));
			rerender(
				<FeatureListCycling {...props} selectedFeatureId="absent" />,
			);
			expect(status.textContent).toBe("");
			rerender(
				<FeatureListCycling
					{...props}
					filteredFeatures={[]}
					selectedFeatureId={undefined}
				/>,
			);
			expect(status.textContent).toBe("");
		},
	);
});
