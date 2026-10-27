import {useEffect} from "react";
import {Provider as ReduxProvider} from "react-redux";

import type {Store} from "@reduxjs/toolkit";

import {EMPTY_FUTURE_FLAGS, FutureFlagsContext} from "../../future/context";
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
	children,
}: {
	store: Store;
	serverState?: ReturnType<Store["getState"]>;
	onCommit?: () => void;
	components?: MapsightUiComponents;
	appChannelListeners?: AppChannelListenerDefinition[];
	future?: FutureFlags;
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
						<ErrorBoundary variant="page">{children}</ErrorBoundary>
					</ComponentsContext.Provider>
				</FutureFlagsContext.Provider>
			</AppChannelProvider>
		</ReduxProvider>
	);
}

export default AppContext;
