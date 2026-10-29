import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
import {CitationPictogramIdsContext} from "../citations/citation-pictogram-ids-context";
import Attribution from "./attribution";

afterEach(cleanup);

beforeEach(() => {
	setDocumentLanguage("de");
});

function renderAttribution(hostPictogramIds: string[]) {
	const store = configureStore({
		reducer: {
			app: () => ({searchResult: {data: {features: []}}}),
			list: () => ({featureSource: undefined}),
			featureSources: () => ({}),
			map: () => ({
				visibleLayers: ["street"],
				layers: {
					street: {
						metaData: {
							attribution:
								'<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
						},
						options: {visible: true},
					},
				},
			}),
		},
	});

	return render(
		<Provider store={store}>
			<CitationPictogramIdsContext.Provider value={hostPictogramIds}>
				<Attribution />
			</CitationPictogramIdsContext.Provider>
		</Provider>,
	);
}

describe("Attribution pictogram lines", () => {
	it("shows the Font Awesome line from host citation ids without opening the modal", () => {
		renderAttribution(["fa-bolt"]);

		expect(
			screen
				.getByRole("link", {name: "Font Awesome"})
				.getAttribute("href"),
		).toBe("https://fontawesome.com");
		expect(screen.getByText(/Piktogramme:/)).toBeTruthy();
		expect(screen.getByText(/Darstellung verändert/)).toBeTruthy();
	});
});
