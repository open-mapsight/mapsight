import {Provider as ReduxProvider} from "react-redux";

import type {Store} from "redux";

import type {MapsightUiComponents} from "../../helpers/components";
import {ComponentsContext} from "../../helpers/components";
import type {AppChannelListenerDefinition} from "../../types";
import {AppChannelProvider} from "./app-channel";

function AppContext({
	store,
	components = {},
	appChannelListeners = [],
	children,
}: {
	store: Store;
	components?: MapsightUiComponents;
	appChannelListeners?: AppChannelListenerDefinition[];
	children?: React.ReactNode;
}) {
	return (
		<ReduxProvider store={store}>
			<AppChannelProvider listeners={appChannelListeners}>
				<ComponentsContext.Provider value={components}>
					{children}
				</ComponentsContext.Provider>
			</AppChannelProvider>
		</ReduxProvider>
	);
}

export default AppContext;
