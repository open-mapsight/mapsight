"use client";

import type {PropsWithChildren} from "react";
import {useMemo} from "react";

import type {State} from "@mapsight/core/types";

import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {create} from "../index";
import type {CreateOptions, MapsightUiRendererProps} from "../types";
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
			create(null, styleFunction, baseMapsightConfig, {
				...createOptions,
				// A declarative tree can be hydrated by its host without browserEmbed.
				// Keep browser-only plugins behind its first commit even without an
				// explicit snapshot; the shared config supplies the initial state.
				reHydratedState: createOptions.reHydratedState ?? {app: {}},
				renderer: (_container, props) => ({
					...props,
					onCommit: props.deferCommit?.(),
				}),
			}),
		[baseMapsightConfig, createOptions, styleFunction],
	);
	const props = context.render?.({}) as MapsightUiRendererProps & {
		onCommit: () => void;
	};
	return <AppContext {...props}>{children}</AppContext>;
}

export default MapsightUi;
