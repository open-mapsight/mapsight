import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
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

	it("hides the duplicate dots from assistive technology", () => {
		renderCycling();
		expect(
			document.querySelectorAll(".ms3-list-cycling-box__dot"),
		).toHaveLength(3);
		expect(screen.getAllByRole("button")).toHaveLength(2);
	});

	it("puts the selected station in an atomic status region", () => {
		const props = {
			filteredFeatures: features,
			selectedFeatureId: "b",
			highlightedFeatureId: undefined,
			onFeatureSelection: vi.fn(),
			onFeatureHighlight: vi.fn(),
			onFeatureUnHighlight: vi.fn(),
		};
		const {rerender} = render(<FeatureListCycling {...props} />);
		(
			document.querySelector(
				".ms3-list-cycling-box__dots-scroller",
			) as HTMLElement
		).scrollTo = vi.fn();
		const status = screen.getByRole("status");
		expect(status.getAttribute("aria-atomic")).toBe("true");
		expect(status.textContent).toBe("Station 2 von 3: City Museum");
		rerender(<FeatureListCycling {...props} selectedFeatureId="a" />);
		expect(status.textContent).toBe("Station 1 von 3: Castle");
		rerender(<FeatureListCycling {...props} selectedFeatureId="absent" />);
		expect(status.textContent).toBe("");
	});
});
