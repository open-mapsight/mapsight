import {useEffect} from "react";
import {Provider as ReduxProvider} from "react-redux";

import type {Store} from "@reduxjs/toolkit";

import {AppChannelProvider} from "../../app-channel";
import {type HeadingOptions, HeadingsProvider} from "../../headings";
import type {MapsightUiComponents} from "../../helpers/components";
import {ComponentsContext} from "../../helpers/components";
import type {AppChannelListenerDefinition} from "../../types";
import ErrorBoundary from "../error-boundary";

function AppContext({
	store,
	serverState,
	onCommit,
	components = {},
	appChannelListeners = [],
	headings,
	children,
}: {
	store: Store;
	serverState?: ReturnType<Store["getState"]>;
	onCommit?: () => void;
	components?: MapsightUiComponents;
	appChannelListeners?: AppChannelListenerDefinition[];
	headings?: HeadingOptions;
	children?: React.ReactNode;
}) {
	useEffect(() => {
		onCommit?.();
	}, [onCommit]);

	return (
		<ReduxProvider store={store} serverState={serverState}>
			<AppChannelProvider listeners={appChannelListeners}>
				<ComponentsContext.Provider value={components}>
					<HeadingsProvider options={headings}>
						<ErrorBoundary variant="page">{children}</ErrorBoundary>
					</HeadingsProvider>
				</ComponentsContext.Provider>
			</AppChannelProvider>
		</ReduxProvider>
	);
}

export default AppContext;
