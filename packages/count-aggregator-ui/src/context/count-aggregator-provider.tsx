import {
	type ReactElement,
	type ReactNode,
	createContext,
	useContext,
} from "react";

import type {
	CountAggregatorAppConfig,
	CountAggregatorConfig,
} from "../types/index.js";

const CountAggregatorConfigContext =
	createContext<CountAggregatorConfig | null>(null);

export function CountAggregatorProvider({
	config,
	children,
}: {
	config: CountAggregatorConfig;
	children: ReactNode;
}): ReactElement {
	return (
		<CountAggregatorConfigContext.Provider value={config}>
			{children}
		</CountAggregatorConfigContext.Provider>
	);
}

export function useCountAggregatorConfig(): CountAggregatorConfig {
	const config = useContext(CountAggregatorConfigContext);

	if (config === null) {
		throw new Error(
			"useCountAggregatorConfig must be used within CountAggregatorProvider",
		);
	}

	return config;
}

export function useAppConfig(appId: string): CountAggregatorAppConfig {
	const config = useCountAggregatorConfig();
	const app = config.apps[appId];

	if (app === undefined) {
		throw new Error(
			`Unknown count-aggregator app "${appId}". Check CountAggregatorProvider config.`,
		);
	}

	return app;
}
