"use client";

import type {PropsWithChildren} from "react";
import {useMemo} from "react";

import type {EnhancedStore, State} from "@mapsight/core/types";

import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {create} from "../index";
import type {CreateOptions} from "../types";
import AppContext from "./helping/app-context";

function MapsightUi({
	children,
	styleFunction,
	baseMapsightConfig,
	createOptions,
}: PropsWithChildren<{
	styleFunction: MapsightStyleFunction;
	baseMapsightConfig: Partial<State>;
	createOptions: CreateOptions;
}>) {
	const context = useMemo(
		() =>
			create(
				null, // FIXME allow passing null?!
				styleFunction,
				baseMapsightConfig,
				createOptions,
			),
		[baseMapsightConfig, createOptions, styleFunction],
	);
	const {components = {}, appChannelListeners = []} = createOptions;
	const {store} = context;

	return (
		<AppContext
			components={components}
			store={store as EnhancedStore}
			appChannelListeners={appChannelListeners}
		>
			{children}
		</AppContext>
	);
}

export default MapsightUi;
