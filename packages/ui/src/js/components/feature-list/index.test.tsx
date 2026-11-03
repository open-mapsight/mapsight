import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import {deselectAll} from "@mapsight/core/lib/feature-selections/actions";

import {VIEW_DESKTOP, VIEW_MOBILE} from "../../config/constants/app";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {useFeatureListContext} from "./context";
import FeatureList from "./index";

vi.mock("./hooks/useFeatureListFeatureSource", () => ({default: () => ({})}));
vi.mock("./hooks/useFeatureListState", () => ({
	default: () => ({features: [], filteredFeatures: [], featureCount: 0}),
}));
afterEach(cleanup);

function DeselectControl() {
	const {deselectFeature} = useFeatureListContext();
	return <button onClick={deselectFeature}>Deselect</button>;
}

it.each([undefined, "preselect"] as const)(
	"deselects the configured selection group (%s), defaulting to select",
	(selectionBehaviorSelection) => {
		const reducer = vi.fn(
			(
				state = {
					app: {
						view: VIEW_DESKTOP,
						list: {selectionBehaviorSelection},
					},
				},
			) => state,
		);
		const store = configureStore({reducer});
		render(
			<Provider store={store}>
				<FeatureList
					contentAs={DeselectControl}
					headerAs={() => null}
					footerAs={() => null}
					autoloadFeatureSource={false}
				/>
			</Provider>,
		);
		fireEvent.click(screen.getByRole("button", {name: "Deselect"}));
		expect(reducer).toHaveBeenLastCalledWith(
			expect.anything(),
			deselectAll(
				FEATURE_SELECTIONS,
				selectionBehaviorSelection ?? "select",
			),
		);
	},
);

it("shares its existing view read without changing context on unrelated updates", () => {
	const initialState = {
		app: {view: VIEW_DESKTOP, list: {}, counter: 0},
	};
	const store = configureStore({
		reducer: (
			state: typeof initialState = initialState,
			action: {type: string},
		) => {
			if (action.type === "unrelated") {
				return {
					...state,
					app: {...state.app, counter: state.app.counter + 1},
				};
			}
			if (action.type === "mobile") {
				return {...state, app: {...state.app, view: VIEW_MOBILE}};
			}
			return state;
		},
	});
	const contexts: ReturnType<typeof useFeatureListContext>[] = [];
	function Content() {
		const context = useFeatureListContext();
		contexts.push(context);
		return <output>{context.view}</output>;
	}
	render(
		<Provider store={store}>
			<FeatureList
				contentAs={Content}
				headerAs={() => null}
				footerAs={() => null}
				autoloadFeatureSource={false}
			/>
		</Provider>,
	);
	expect(contexts).toHaveLength(1);
	expect(contexts[0].view).toBe(VIEW_DESKTOP);
	act(() => {
		store.dispatch({type: "unrelated"});
	});
	expect(contexts).toHaveLength(1);
	act(() => {
		store.dispatch({type: "mobile"});
	});
	expect(contexts).toHaveLength(2);
	expect(contexts[1].view).toBe(VIEW_MOBILE);
});
