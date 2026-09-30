import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
import FeatureListCycling from "./feature-list-cycling";

const features = [{id: "a"}, {id: "b"}, {id: "c"}];

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
});
