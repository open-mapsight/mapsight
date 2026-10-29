import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
import {CitationPictogramIdsContext} from "./citation-pictogram-ids-context";
import Citations from "./citations";

afterEach(cleanup);

beforeEach(() => {
	setDocumentLanguage("en");
});

function createStore() {
	return configureStore({
		reducer: {
			app: () => ({
				searchResult: {data: {features: []}},
			}),
			list: () => ({featureSource: "schools"}),
			featureSources: () => ({
				schools: {
					type: "xhr-json",
					data: {features: []},
					lastUpdate: null,
					lastActionType: null,
				},
			}),
			map: () => ({
				visibleLayers: ["street"],
				layers: {
					street: {
						metaData: {
							attribution:
								'<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
							legend: '<img alt="Street legend" src="legend.png" />',
						},
						options: {
							visible: true,
							style: {mapsightIconId: "fa-school"},
							source: {
								type: "VectorFeatureSource",
								options: {featureSourceId: "schools"},
							},
						},
					},
				},
			}),
		},
	});
}

function renderCitations(
	hostPictogramIds: string[] = [],
	slots?: {
		datasetLicenses?: React.ReactNode;
		projectNotice?: React.ReactNode;
		hostCopyright?: React.ReactNode;
	},
) {
	return render(
		<Provider store={createStore()}>
			<CitationPictogramIdsContext.Provider value={hostPictogramIds}>
				<Citations
					datasetLicenses={slots?.datasetLicenses}
					projectNotice={slots?.projectNotice}
					hostCopyright={slots?.hostCopyright}
				/>
			</CitationPictogramIdsContext.Provider>
		</Provider>,
	);
}

describe("Citations", () => {
	it("renders layer attributions, Font Awesome pictogram credit, and legends", () => {
		renderCitations(["marker"]);

		expect(
			screen
				.getByRole("link", {name: "OpenStreetMap"})
				.getAttribute("href"),
		).toBe("https://www.openstreetmap.org/copyright");
		expect(
			screen
				.getByRole("link", {name: "Font Awesome"})
				.getAttribute("href"),
		).toBe("https://fontawesome.com");
		expect(
			screen.getByRole("link", {name: "CC BY 4.0"}).getAttribute("href"),
		).toBe("https://creativecommons.org/licenses/by/4.0/");
		expect(screen.getByText(/Pictograms:/)).toBeTruthy();
		expect(screen.getByText(/adapted/)).toBeTruthy();
		expect(screen.getByAltText("Street legend")).toBeTruthy();
		expect(screen.queryByText(/this uses Mapsight/i)).toBeNull();
	});

	it("uses the German pictogram attribution wording", () => {
		setDocumentLanguage("de");
		renderCitations();

		expect(screen.getByText(/Piktogramme:/)).toBeTruthy();
		expect(screen.getByText(/Darstellung verändert/)).toBeTruthy();
	});

	it("renders reserved sections only when they have content", () => {
		renderCitations([], {
			datasetLicenses: <p>Dataset license</p>,
		});

		expect(screen.getByText("Dataset license")).toBeTruthy();
		expect(screen.queryByText("Project notice")).toBeNull();
	});
});
