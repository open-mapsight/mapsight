import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, expect, it} from "vitest";

import TagSwitcher from "../tag-switcher/TagSwitcher";
import GroupedSwitcher from "./GroupedSwitcher";

afterEach(cleanup);

it("passes heading tags through grouped switchers and retains h3 by default", () => {
	const props = {groupedIds: {Places: []}, renderEntry: () => null};
	const {rerender} = render(<GroupedSwitcher {...props} />);
	expect(
		screen.getByRole("heading", {level: 3, name: "Places"}),
	).toBeTruthy();
	rerender(<GroupedSwitcher {...props} headlineAs="h2" />);
	expect(
		screen.getByRole("heading", {level: 2, name: "Places"}),
	).toBeTruthy();
	rerender(<GroupedSwitcher {...props} headlineAs="div" />);
	expect(screen.queryByRole("heading")).toBeNull();
});

it("passes the tag-switcher heading option to its headers", () => {
	render(
		<Provider store={configureStore({reducer: () => ({})})}>
			<TagSwitcher
				featureSourceId="places"
				groupedTagData={{Places: {tags: {}, count: 0}}}
				headlineAs="h2"
			/>
		</Provider>,
	);
	expect(
		screen.getByRole("heading", {level: 2, name: "Places"}),
	).toBeTruthy();
});
