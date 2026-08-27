import {type ReactElement, useMemo, useState} from "react";
import {Link} from "react-router-dom";

import {
	CountAggregatorProvider,
	createStationTypeAppsConfig,
	dateToYmd,
	useAggregatedValues,
	useStationTypesQuery,
	useStationsQuery,
	ymdToDate,
} from "@mapsight/count-aggregator-ui/headless";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {COUNT_AGGREGATOR_MOCK_API_BASE} from "./constants.ts";

const APP_ID = "bicycleSensorTotal";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 0,
			refetchOnWindowFocus: false,
		},
	},
});

function defaultRange(): {start: string; end: string} {
	const end = new Date();
	const start = new Date(end);
	start.setDate(end.getDate() - 6);
	return {start: dateToYmd(start), end: dateToYmd(end)};
}

function HeadlessWizard(): ReactElement {
	const stationsQuery = useStationsQuery(APP_ID);
	const stations = useMemo(() => {
		const map = stationsQuery.data;
		if (map === undefined) {
			return [];
		}
		return [...map.values()].sort((a, b) =>
			(a.label ?? a.originId).localeCompare(b.label ?? b.originId),
		);
	}, [stationsQuery.data]);

	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [range, setRange] = useState(defaultRange);
	const [submitted, setSubmitted] = useState<{
		stationIds: number[];
		startDate: Date;
		endDate: Date;
	} | null>(null);

	const values = useAggregatedValues(APP_ID, submitted ?? {}, {
		enabled: submitted !== null,
	});

	const rows = useMemo(() => {
		if (values === undefined) {
			return [];
		}
		const out: {station: string; date: string; value: number}[] = [];
		for (const stationData of values.stationsById.values()) {
			const station = stations.find(
				(s) => s.id === stationData.stationId,
			);
			const label =
				station?.label ??
				station?.originId ??
				String(stationData.stationId);
			for (const point of stationData.values) {
				out.push({
					station: label,
					date: dateToYmd(point.date),
					value: point.value,
				});
			}
		}
		return out.sort((a, b) =>
			a.date === b.date
				? a.station.localeCompare(b.station)
				: a.date.localeCompare(b.date),
		);
	}, [stations, values]);

	const toggleStation = (id: number) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
		setSubmitted(null);
	};

	return (
		<div className="count-aggregator-headless">
			<p className="count-aggregator-headless__note">
				Imports only <code>@mapsight/count-aggregator-ui/headless</code>{" "}
				— no package CSS, no <code>CountAggregatorWizard</code>. Host
				styles this UI.
			</p>

			<section className="count-aggregator-headless__section">
				<h2>1. Stations</h2>
				{stationsQuery.isPending ? (
					<p>Loading stations…</p>
				) : stationsQuery.isError ? (
					<p>Could not load stations from the mock API.</p>
				) : (
					<ul className="count-aggregator-headless__station-list">
						{stations.map((station) => {
							const label = station.label ?? station.originId;
							const checked = selectedIds.includes(station.id);
							return (
								<li key={station.id}>
									<label>
										<input
											type="checkbox"
											checked={checked}
											onChange={() =>
												toggleStation(station.id)
											}
										/>{" "}
										{label}
									</label>
								</li>
							);
						})}
					</ul>
				)}
			</section>

			<section className="count-aggregator-headless__section">
				<h2>2. Range</h2>
				<div className="count-aggregator-headless__range">
					<label>
						From{" "}
						<input
							type="date"
							value={range.start}
							onChange={(event) => {
								setRange((prev) => ({
									...prev,
									start: event.target.value,
								}));
								setSubmitted(null);
							}}
						/>
					</label>
					<label>
						To{" "}
						<input
							type="date"
							value={range.end}
							onChange={(event) => {
								setRange((prev) => ({
									...prev,
									end: event.target.value,
								}));
								setSubmitted(null);
							}}
						/>
					</label>
				</div>
				<button
					type="button"
					className="count-aggregator-headless__load"
					disabled={
						selectedIds.length === 0 || !range.start || !range.end
					}
					onClick={() => {
						setSubmitted({
							stationIds: selectedIds,
							startDate: ymdToDate(range.start),
							endDate: ymdToDate(range.end),
						});
					}}
				>
					Load daily values
				</button>
			</section>

			<section className="count-aggregator-headless__section">
				<h2>3. Result</h2>
				{submitted === null ? (
					<p>Select stations and load a range.</p>
				) : values === undefined ? (
					<p>Loading values…</p>
				) : rows.length === 0 ? (
					<p>No rows for this selection.</p>
				) : (
					<table className="count-aggregator-headless__table">
						<thead>
							<tr>
								<th scope="col">Date</th>
								<th scope="col">Station</th>
								<th scope="col">Value</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={`${row.date}-${row.station}`}>
									<td>{row.date}</td>
									<td>{row.station}</td>
									<td>{row.value}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</section>
		</div>
	);
}

function HeadlessBootstrap(): ReactElement {
	const stationTypesQuery = useStationTypesQuery(
		COUNT_AGGREGATOR_MOCK_API_BASE,
	);

	const config = useMemo(() => {
		if (stationTypesQuery.data === undefined) {
			return null;
		}
		return createStationTypeAppsConfig(stationTypesQuery.data, {
			apiBaseUrl: COUNT_AGGREGATOR_MOCK_API_BASE,
		});
	}, [stationTypesQuery.data]);

	if (stationTypesQuery.isPending) {
		return <p>Loading station types…</p>;
	}
	if (stationTypesQuery.isError || config === null) {
		return (
			<p>
				Mock API unavailable. Run the showcase dev server so the
				count-aggregator middleware is active.
			</p>
		);
	}

	return (
		<CountAggregatorProvider config={config}>
			<HeadlessWizard />
		</CountAggregatorProvider>
	);
}

export function CountAggregatorHeadlessPage(): ReactElement {
	return (
		<div className="showcase-page count-aggregator-demo">
			<div className="showcase-page__hero">
				<p className="count-aggregator-demo__eyebrow">
					<Link to="/count-aggregator">← Styled wizard demo</Link>
				</p>
				<h1>Count aggregator (headless)</h1>
				<p>
					Minimal custom flow built on the <code>/headless</code>{" "}
					entry — hooks + provider only, host-owned markup.
				</p>
			</div>

			<QueryClientProvider client={queryClient}>
				<HeadlessBootstrap />
			</QueryClientProvider>
		</div>
	);
}
