import {type ReactNode, memo, useContext, useMemo} from "react";
import {hydrateRoot} from "react-dom/client";
import {renderToString} from "react-dom/server";
import {
	Provider,
	ReactReduxContext,
	type Subscription,
	useSelector,
} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, render} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import {VIEW_DESKTOP, VIEW_MOBILE} from "../../../config/constants/app";
import type * as Selectors from "../../../store/selectors";
import {viewSelector} from "../../../store/selectors";
import type {MapsightUiFeature, MapsightUiView} from "../../../types";
import {
	FeatureListContextProvider,
	type FeatureListContextValue,
} from "../../feature-list/context";
import useFeatureListItemState from "./useFeatureListItemState";

vi.mock("../../../store/selectors", async (importOriginal) => {
	const actual = await importOriginal<typeof Selectors>();
	return {...actual, viewSelector: vi.fn(actual.viewSelector)};
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const feature: MapsightUiFeature = {
	type: "Feature",
	id: "item-1",
	geometry: {type: "Point", coordinates: [0, 0]},
	properties: {name: "Example"},
};

const contextValue: FeatureListContextValue = {
	state: {} as FeatureListContextValue["state"],
	listUiOptions: {
		showSelectedOnly: false,
		selectionBehavior: {desktop: null, mobile: "expandInList"},
	},
	enableKeyboardControl: false,
	showFeatureListInfo: false,
	selectFeature: () => {},
	deselectFeature: () => {},
	itemProps: {
		enableKeyboardControl: false,
		showFeatureListInfo: false,
		selectFeature: () => {},
		deselectFeature: () => {},
	},
};

function makeStore(view: MapsightUiView = VIEW_DESKTOP) {
	const initialState = {
		app: {view},
		featureSelections: {
			select: {features: [] as string[]},
			highlight: {features: [] as string[]},
			preselect: {features: [] as string[]},
		},
		counter: 0,
	};
	return configureStore({
		reducer: (
			state: typeof initialState = initialState,
			action: {type: string; view?: MapsightUiView},
		) => {
			if (action.type === "view") {
				return {...state, app: {...state.app, view: action.view!}};
			}
			if (action.type === "unrelated") {
				return {...state, counter: state.counter + 1};
			}
			return state;
		},
	});
}

// The list already reads view. Compare passing that read through context with
// the legacy custom-provider shape, which omits it.
function ListContext({
	shared,
	children,
}: {
	shared: boolean;
	children: ReactNode;
}) {
	const view = useSelector(viewSelector);
	const value = useMemo(
		() => ({...contextValue, ...(shared ? {view} : {})}),
		[shared, view],
	);
	return (
		<FeatureListContextProvider value={value}>
			{children}
		</FeatureListContextProvider>
	);
}

function trackNestedSubscriptions(
	subscription: Subscription,
	tracking: {active: number; callbacks: number},
) {
	const original = subscription.addNestedSub;
	vi.spyOn(subscription, "addNestedSub").mockImplementation((listener) => {
		tracking.active++;
		const unsubscribe = original(() => {
			tracking.callbacks++;
			listener();
		});
		return () => {
			tracking.active--;
			unsubscribe();
		};
	});
}

function mountedRows(shared: boolean) {
	const store = makeStore();
	const tracking = {active: 0, callbacks: 0};
	function TrackNestedSubscriptions({children}: {children: ReactNode}) {
		const {subscription} = useContext(ReactReduxContext)!;
		useMemo(() => {
			trackNestedSubscriptions(subscription, tracking);
		}, [subscription]);
		return children;
	}
	const rendered = vi.fn((_index: number) => {});
	const Row = memo(function Row({index}: {index: number}) {
		rendered(index);
		const state = useFeatureListItemState(feature, {
			observeGlobalSelection: false,
		});
		return <output>{state.view}</output>;
	});
	const rows = [0, 1, 2].map((index) => <Row key={index} index={index} />);
	const tree = (shared: boolean) => (
		<Provider store={store}>
			<TrackNestedSubscriptions>
				<ListContext shared={shared}>{rows}</ListContext>
			</TrackNestedSubscriptions>
		</Provider>
	);
	const mounted = render(tree(shared));
	return {
		store,
		tracking,
		renders: () =>
			[0, 1, 2].map(
				(index) =>
					rendered.mock.calls.filter(([id]) => id === index).length,
			),
		mounted,
		shareView: (shared: boolean) => mounted.rerender(tree(shared)),
	};
}

it("removes one nested callback and view evaluation per row on unrelated updates", () => {
	const measurements: Array<{active: number; callbacks: number}> = [];
	for (const shared of [false, true]) {
		const {store, tracking, renders, mounted} = mountedRows(shared);
		tracking.callbacks = 0;
		vi.mocked(viewSelector).mockClear();
		act(() => {
			store.dispatch({type: "unrelated"});
		});
		expect(viewSelector).toHaveBeenCalledTimes(shared ? 1 : 4);
		expect(renders()).toEqual([1, 1, 1]);
		measurements.push({...tracking});
		mounted.unmount();
		expect(tracking.active).toBe(0);
	}
	expect(measurements[0].active - measurements[1].active).toBe(3);
	expect(measurements[0].callbacks - measurements[1].callbacks).toBe(3);
});

it("switches between shared and legacy contexts without stale views or subscriptions", () => {
	const {store, tracking, mounted, shareView} = mountedRows(true);
	const sharedSubscriptions = tracking.active;
	const views = () =>
		[...mounted.container.querySelectorAll("output")].map(
			(element) => element.textContent,
		);
	act(() => {
		store.dispatch({type: "view", view: VIEW_MOBILE});
	});
	expect(views()).toEqual([VIEW_MOBILE, VIEW_MOBILE, VIEW_MOBILE]);
	shareView(false);
	expect(tracking.active).toBe(sharedSubscriptions + 3);
	act(() => {
		store.dispatch({type: "view", view: VIEW_DESKTOP});
	});
	expect(views()).toEqual([VIEW_DESKTOP, VIEW_DESKTOP, VIEW_DESKTOP]);
	shareView(true);
	expect(tracking.active).toBe(sharedSubscriptions);
	act(() => {
		store.dispatch({type: "view", view: VIEW_MOBILE});
	});
	expect(views()).toEqual([VIEW_MOBILE, VIEW_MOBILE, VIEW_MOBILE]);
});

it("uses shared view changes for inline details and selection scrolling", () => {
	const initialState = makeStore().getState();
	const store = configureStore({
		reducer: () => ({
			...initialState,
			featureSelections: {
				...initialState.featureSelections,
				select: {features: [feature.id]},
			},
		}),
	});
	function Row() {
		const state = useFeatureListItemState(feature);
		return (
			<output
				data-mobile={state.isMobile}
				data-details={state.showDetails}
				data-scroll={state.scrollOnSelection}
			>
				{state.view}
			</output>
		);
	}
	const tree = (view: MapsightUiView) => (
		<Provider store={store}>
			<FeatureListContextProvider value={{...contextValue, view}}>
				<Row />
			</FeatureListContextProvider>
		</Provider>
	);
	const mounted = render(tree(VIEW_MOBILE));
	const output = mounted.container.querySelector("output")!;
	expect(output.dataset).toMatchObject({
		mobile: "true",
		details: "true",
		scroll: "true",
	});
	mounted.rerender(tree(VIEW_DESKTOP));
	expect(output.dataset).toMatchObject({
		mobile: "false",
		details: "false",
		scroll: "false",
	});
});

it.each([false, true])(
	"hydrates from Provider serverState before observing the client view (shared=%s)",
	async (shared) => {
		const store = makeStore(VIEW_MOBILE);
		const serverState = {...store.getState(), app: {view: VIEW_DESKTOP}};
		function Row() {
			const state = useFeatureListItemState(feature);
			return <output>{state.view}</output>;
		}
		const tree = (
			<Provider store={store} serverState={serverState}>
				<ListContext shared={shared}>
					<Row />
				</ListContext>
			</Provider>
		);
		const container = document.createElement("div");
		container.innerHTML = renderToString(tree);
		expect(container.textContent).toBe(VIEW_DESKTOP);
		document.body.append(container);
		const onRecoverableError = vi.fn();
		let root: ReturnType<typeof hydrateRoot>;
		await act(async () => {
			root = hydrateRoot(container, tree, {onRecoverableError});
			await Promise.resolve();
		});
		expect(onRecoverableError).not.toHaveBeenCalled();
		expect(container.textContent).toBe(VIEW_MOBILE);
		act(() => root.unmount());
		container.remove();
	},
);
