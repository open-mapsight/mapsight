import {
	type CSSProperties,
	type ReactElement,
	type ReactNode,
	createContext,
	useContext,
	useId,
	useMemo,
} from "react";

import {cn} from "../../lib/utils.js";

export type ChartConfig = Record<
	string,
	{
		label?: ReactNode;
		color?: string;
	}
>;

interface ChartContextValue {
	config: ChartConfig;
}

const ChartContext = createContext<ChartContextValue | null>(null);

function useChartContext(): ChartContextValue {
	const context = useContext(ChartContext);

	if (context === null) {
		throw new Error("useChartContext must be used within ChartContainer");
	}

	return context;
}

function useChartId(providedId?: string): string {
	const generatedId = useId();

	return providedId ?? `chart-${generatedId}`;
}

export function ChartContainer({
	id,
	className,
	children,
	config,
	style,
}: {
	id?: string;
	className?: string;
	children: ReactNode;
	config: ChartConfig;
	style?: CSSProperties;
}): ReactElement {
	const chartId = useChartId(id);

	const cssVars = useMemo(() => {
		const vars: Record<string, string> = {};

		for (const [key, itemConfig] of Object.entries(config)) {
			if (itemConfig.color !== undefined) {
				vars[`--color-${key}`] = itemConfig.color;
			}
		}

		return vars;
	}, [config]);

	return (
		<ChartContext.Provider value={{config}}>
			<div
				data-chart={chartId}
				className={cn(
					"msp-count-aggregator-chart msca:flex msca:aspect-auto msca:justify-center msca:text-xs",
					className,
				)}
				style={{...cssVars, ...style}}
			>
				{children}
			</div>
		</ChartContext.Provider>
	);
}

interface TooltipPayloadItem {
	name?: string;
	value?: number;
	color?: string;
	dataKey?: string | number;
	payload?: {
		date?: number;
	};
}

export function ChartTooltipContent({
	active,
	payload,
	labelFormatter,
}: {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	labelFormatter?: (label: number) => ReactNode;
}): ReactElement | null {
	const {config} = useChartContext();

	if (!active || payload === undefined || payload.length === 0) {
		return null;
	}

	const label = payload[0]?.payload?.date;

	return (
		<div className="msca:rounded-md msca:border msca:border-gray-200 msca:bg-white/95 msca:px-3 msca:py-2 msca:shadow-sm">
			{label !== undefined && labelFormatter !== undefined ? (
				<div className="msca:mb-1 msca:font-medium msca:text-gray-900">
					{labelFormatter(label)}
				</div>
			) : null}
			<div className="msca:grid msca:gap-1">
				{payload.map((item) => {
					const key = String(item.dataKey ?? "");
					const itemConfig = config[key];

					return (
						<div
							key={key}
							className="msca:flex msca:items-center msca:justify-between msca:gap-4"
						>
							<div className="msca:flex msca:items-center msca:gap-2">
								<span
									className="msca:h-2 msca:w-2 msca:rounded-full"
									style={{backgroundColor: item.color}}
								/>
								<span className="msca:text-gray-600">
									{itemConfig?.label ?? item.name}
								</span>
							</div>
							<span className="msca:font-medium msca:tabular-nums msca:text-gray-900">
								{item.value?.toLocaleString()}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export function ChartLegendContent({
	payload,
}: {
	payload?: Array<{
		value?: string;
		color?: string;
		dataKey?: string | number;
	}>;
}): ReactElement | null {
	const {config} = useChartContext();

	if (payload === undefined || payload.length === 0) {
		return null;
	}

	return (
		<div className="msca:flex msca:flex-wrap msca:items-center msca:gap-4 msca:pt-3">
			{payload.map((entry) => {
				const key = String(entry.dataKey ?? entry.value ?? "");
				const itemConfig = config[key];

				return (
					<div
						key={key}
						className="msca:flex msca:items-center msca:gap-2 msca:text-sm"
					>
						<span
							className="msca:h-2 msca:w-2 msca:rounded-full"
							style={{backgroundColor: entry.color}}
						/>
						<span>{itemConfig?.label ?? entry.value}</span>
					</div>
				);
			})}
		</div>
	);
}
