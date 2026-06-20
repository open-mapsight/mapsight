import type {CSSProperties, ReactElement, ReactNode} from "react";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import type {CountAggregatorTheme} from "../lib/theme.js";
import type {CountAggregatorConfig} from "../types/index.js";
import {CountAggregatorProvider} from "./count-aggregator-provider.js";
import {CountAggregatorRoot} from "./count-aggregator-root.js";

const defaultQueryClient = new QueryClient();

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
	const client = queryClient ?? defaultQueryClient;

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
