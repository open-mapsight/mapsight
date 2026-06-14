import type {CSSProperties, ReactElement, ReactNode} from "react";
import {useState} from "react";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import type {CountAggregatorTheme} from "../lib/theme.js";
import type {CountAggregatorConfig} from "../types/index.js";
import {CountAggregatorProvider} from "./count-aggregator-provider.js";
import {CountAggregatorRoot} from "./count-aggregator-root.js";

export interface CountAggregatorShellProps {
	config: CountAggregatorConfig;
	queryClient?: QueryClient;
	theme?: CountAggregatorTheme;
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
}

export function CountAggregatorShell({
	config,
	queryClient,
	theme,
	className,
	style,
	children,
}: CountAggregatorShellProps): ReactElement {
	const [internalQueryClient] = useState(() => new QueryClient());
	const client = queryClient ?? internalQueryClient;

	return (
		<CountAggregatorRoot theme={theme} className={className} style={style}>
			<QueryClientProvider client={client}>
				<CountAggregatorProvider config={config}>
					{children}
				</CountAggregatorProvider>
			</QueryClientProvider>
		</CountAggregatorRoot>
	);
}
