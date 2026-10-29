import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, expect, it} from "vitest";

import TagSwitcher from "../tag-switcher/TagSwitcher";

afterEach(cleanup);

it("passes the tag-switcher heading option through grouped switchers and uses contextual h2 by default", () => {
	const store = configureStore({reducer: () => ({})});
	const props = {
		featureSourceId: "places",
		groupedTagData: {Places: {tags: {}, count: 0}},
	};
	const {rerender} = render(
		<Provider store={store}>
			<TagSwitcher {...props} />
		</Provider>,
	);
	expect(
		screen.getByRole("heading", {level: 2, name: "Places"}),
	).toBeTruthy();
	rerender(
		<Provider store={store}>
			<TagSwitcher {...props} headlineAs="h4" />
		</Provider>,
	);
	expect(
		screen.getByRole("heading", {level: 4, name: "Places"}),
	).toBeTruthy();
});
