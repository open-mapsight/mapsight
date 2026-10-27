import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import FeatureListOptionsPopover from "../components/feature-list/list-options-popover/FeatureListOptionsPopover";
import ToolOverlay from "../components/map-overlay/tool-overlay";
import Modal from "../components/modal";
import TagSwitcher from "../components/tag-switcher/TagSwitcher";
import {setDocumentLanguage, translate} from "../helpers/i18n";
import {Heading, HeadingsProvider} from "./index";

vi.mock(
	"../components/feature-list/list-options-popover/useListOptionsController",
	() => ({
		default: () => ({
			featureCount: 1,
			totalFeatureCount: 1,
			sorting: "",
			places: {},
			activeFilterCount: 0,
			canResetOptions: false,
			hasCustomSorting: false,
			setSorting: vi.fn(),
			reset: vi.fn(),
		}),
	}),
);

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

it.each([false, true])(
	"keeps legacy overlay headings or derives a complete popover hierarchy (enabled=%s)",
	(enabled) => {
		setDocumentLanguage("en");
		render(
			<Provider store={configureStore({reducer: () => ({})})}>
				<HeadingsProvider enabled={enabled} options={{baseLevel: 2}}>
					<FeatureListOptionsPopover>
						<TagSwitcher
							groupedTagData={{Places: {tags: {}, count: 0}}}
							featureSourceId="places"
							headlineAs={enabled ? undefined : "h3"}
						/>
					</FeatureListOptionsPopover>
				</HeadingsProvider>
			</Provider>,
		);
		fireEvent.click(screen.getByRole("button"));
		expect(
			screen.getByRole("heading", {
				name: translate("ui.feature-list.options.title"),
				level: enabled ? 2 : 3,
			}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {
				name: translate("ui.feature-list.options.filter"),
				level: enabled ? 3 : 4,
			}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {
				name: "Places",
				level: enabled ? 4 : 3,
			}),
		).toBeTruthy();
	},
);

it.each([false, true])(
	"uses a local scope in the legacy modal only with the flag (enabled=%s)",
	(enabled) => {
		render(
			<HeadingsProvider enabled={enabled} options={{baseLevel: 4}}>
				<Modal
					isOpen
					headline="Layers"
					contentLabel="Layers"
					ariaHideApp={false}
				>
					<Heading fallbackAs="h4">Group</Heading>
				</Modal>
			</HeadingsProvider>,
		);
		expect(
			screen.getByRole("heading", {
				name: "Layers",
				level: enabled ? 2 : 3,
			}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {
				name: "Group",
				level: enabled ? 3 : 4,
			}),
		).toBeTruthy();
	},
);

it("names tool regions from contextual headings and scopes their content", () => {
	render(
		<HeadingsProvider enabled options={{baseLevel: 3}}>
			<ToolOverlay label="Measure" text="Instructions" onClose={vi.fn()}>
				<Heading>Result</Heading>
			</ToolOverlay>
		</HeadingsProvider>,
	);
	expect(
		screen.getByRole("heading", {name: "Measure", level: 3}),
	).toBeTruthy();
	expect(
		screen.getByRole("heading", {name: "Result", level: 4}),
	).toBeTruthy();
	expect(screen.getByRole("region", {name: "Measure"})).toBeTruthy();
});
