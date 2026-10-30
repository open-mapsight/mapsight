import {useEffect} from "react";
import {Provider as ReduxProvider} from "react-redux";

import type {Store} from "@reduxjs/toolkit";

import {EMPTY_FUTURE_FLAGS, FutureFlagsContext} from "../../future/context";
import {type HeadingOptions, HeadingsProvider} from "../../headings";
import type {MapsightUiComponents} from "../../helpers/components";
import {ComponentsContext} from "../../helpers/components";
import type {AppChannelListenerDefinition, FutureFlags} from "../../types";
import ErrorBoundary from "../error-boundary";
import {AppChannelProvider} from "./app-channel";

function AppContext({
	store,
	serverState,
	onCommit,
	components = {},
	appChannelListeners = [],
	future = EMPTY_FUTURE_FLAGS,
	headings,
	children,
}: {
	store: Store;
	serverState?: ReturnType<Store["getState"]>;
	onCommit?: () => void;
	components?: MapsightUiComponents;
	appChannelListeners?: AppChannelListenerDefinition[];
	future?: FutureFlags;
	headings?: HeadingOptions;
	children?: React.ReactNode;
}) {
	useEffect(() => {
		onCommit?.();
	}, [onCommit]);

	return (
		<ReduxProvider store={store} serverState={serverState}>
			<AppChannelProvider listeners={appChannelListeners}>
				<FutureFlagsContext.Provider value={future}>
					<ComponentsContext.Provider value={components}>
						<HeadingsProvider
							enabled={future.v8_automaticHeadings === true}
							options={headings}
						>
							<ErrorBoundary variant="page">
								{children}
							</ErrorBoundary>
						</HeadingsProvider>
					</ComponentsContext.Provider>
				</FutureFlagsContext.Provider>
			</AppChannelProvider>
		</ReduxProvider>
	);
}

export default AppContext;
