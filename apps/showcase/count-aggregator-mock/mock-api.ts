import type {IncomingMessage, ServerResponse} from "node:http";

import stationListFixture from "../../../packages/count-aggregator-api/src/fixtures/station-list.json";
import stationTypesFixture from "./fixtures/station-types.json";

/** Keep in sync with `src/count-aggregator/constants.ts`. */
const COUNT_AGGREGATOR_MOCK_API_BASE = "/mock/msp/public/count-aggregator";

export interface MockHttpResponse {
	status: number;
	headers: Record<string, string>;
	body: string;
}

interface StationEntry {
	id: number;
	type: string;
	origin_id: string;
	name: string;
	label: string | null;
}

interface StationListFixture {
	data: StationEntry[];
}

const stationList = stationListFixture as StationListFixture;

const stationById = new Map<number, StationEntry>(
	stationList.data.map((entry) => [entry.id, entry]),
);

function parseYmd(ymd: string): Date {
	const [year, month, day] = ymd.split("-").map(Number);
	if (
		year === undefined ||
		month === undefined ||
		day === undefined ||
		!Number.isFinite(year) ||
		!Number.isFinite(month) ||
		!Number.isFinite(day)
	) {
		throw new Error(`Invalid Y-m-d date: "${ymd}"`);
	}

	return new Date(year, month - 1, day);
}

function formatLocalDateTime(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day} 00:00:00`;
}

function eachDayInclusive(fromYmd: string, toYmd: string): Date[] {
	const days: Date[] = [];
	const cursor = parseYmd(fromYmd);
	const end = parseYmd(toYmd);

	while (cursor <= end) {
		days.push(new Date(cursor));
		cursor.setDate(cursor.getDate() + 1);
	}

	return days;
}

function pseudoValue(stationId: number, date: Date): number {
	const seed = stationId * 97 + date.getDate() * 13 + date.getMonth() * 401;
	return 800 + (seed % 2200);
}

function buildValuesMap(
	stationIds: readonly number[],
	fromYmd: string,
	toYmd: string,
	resolution: string,
): Record<string, unknown> {
	const days = eachDayInclusive(fromYmd, toYmd);
	const map: Record<string, unknown> = {};

	for (const stationId of stationIds) {
		const station = stationById.get(stationId);
		if (station === undefined) {
			continue;
		}

		const values = days.map((day) => ({
			datetime: formatLocalDateTime(day),
			value: pseudoValue(stationId, day),
		}));

		const lastDay = days.at(-1) ?? parseYmd(fromYmd);

		map[String(stationId)] = {
			id: stationId,
			fromDateTime: `${fromYmd} 00:00:00`,
			toDateTime: `${toYmd} 00:00:00`,
			lastDateTime: formatLocalDateTime(lastDay).replace(
				" 00:00:00",
				" 23:59:59",
			),
			resolution,
			stationId: station.origin_id,
			values,
		};
	}

	return map;
}

function buildCsv(
	stationIds: readonly number[],
	fromYmd: string,
	toYmd: string,
	resolution: string,
): string {
	const map = buildValuesMap(stationIds, fromYmd, toYmd, resolution);
	const lines = ["Zeitpunkt;Station;Wert"];

	for (const stationId of stationIds) {
		const series = map[String(stationId)] as
			| {values: {datetime: string; value: number}[]; stationId: string}
			| undefined;
		const station = stationById.get(stationId);
		const label = station?.label ?? station?.name ?? String(stationId);

		for (const point of series?.values ?? []) {
			lines.push(`${point.datetime};${label};${point.value}`);
		}
	}

	return `${lines.join("\n")}\n`;
}

function parseStationIds(searchParams: URLSearchParams): number[] {
	const raw = searchParams.get("stationIds");
	if (raw === null || raw.length === 0) {
		return [];
	}

	return raw
		.split(",")
		.map((part) => Number(part.trim()))
		.filter((id) => Number.isInteger(id));
}

export function resolveCountAggregatorMockRequest(
	requestUrl: string,
): MockHttpResponse | null {
	const url = new URL(requestUrl, "http://showcase.local");
	const basePrefix = COUNT_AGGREGATOR_MOCK_API_BASE;

	if (!url.pathname.startsWith(basePrefix)) {
		return null;
	}

	const subPath = url.pathname.slice(basePrefix.length);
	const format = url.searchParams.get("format") ?? "json";

	if (subPath === "/station-types") {
		return jsonResponse(stationTypesFixture);
	}

	const stationsMatch = subPath.match(/^\/([^/]+)\/stations$/);
	if (stationsMatch !== null) {
		return jsonResponse(stationList);
	}

	const valuesMatch = subPath.match(
		/^\/([^/]+)\/values\/(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})\/([^/]+)$/,
	);
	if (valuesMatch !== null) {
		const fromYmd = valuesMatch[2];
		const toYmd = valuesMatch[3];
		const resolution = valuesMatch[4];

		if (
			fromYmd === undefined ||
			toYmd === undefined ||
			resolution === undefined
		) {
			return jsonResponse({message: "Invalid values path"}, 400);
		}

		const stationIds = parseStationIds(url.searchParams);

		if (stationIds.length === 0) {
			return jsonResponse({message: "stationIds is required"}, 400);
		}

		if (format === "csv") {
			return textResponse(
				buildCsv(stationIds, fromYmd, toYmd, resolution),
				"text/csv; charset=utf-8",
			);
		}

		return jsonResponse(
			buildValuesMap(stationIds, fromYmd, toYmd, resolution),
		);
	}

	const lastValuesMatch = subPath.match(/^\/([^/]+)\/last-values\/([^/]+)$/);
	if (lastValuesMatch !== null) {
		const resolution = lastValuesMatch[2];

		if (resolution === undefined) {
			return jsonResponse({message: "Invalid last-values path"}, 400);
		}

		const stationIds = parseStationIds(url.searchParams);
		const limit = Number(url.searchParams.get("limit") ?? "7");
		const end = new Date();
		const start = new Date(end);
		start.setDate(end.getDate() - Math.max(limit - 1, 0));
		const fromYmd = formatLocalDateTime(start).slice(0, 10);
		const toYmd = formatLocalDateTime(end).slice(0, 10);

		if (stationIds.length === 0) {
			return jsonResponse({message: "stationIds is required"}, 400);
		}

		if (format === "csv") {
			return textResponse(
				buildCsv(stationIds, fromYmd, toYmd, resolution),
				"text/csv; charset=utf-8",
			);
		}

		return jsonResponse(
			buildValuesMap(stationIds, fromYmd, toYmd, resolution),
		);
	}

	return jsonResponse({message: `No mock handler for ${subPath}`}, 404);
}

function jsonResponse(body: unknown, status = 200): MockHttpResponse {
	return {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
		body: JSON.stringify(body),
	};
}

function textResponse(body: string, contentType: string): MockHttpResponse {
	return {
		status: 200,
		headers: {
			"Content-Type": contentType,
		},
		body,
	};
}

export function writeMockHttpResponse(
	res: ServerResponse,
	mock: MockHttpResponse,
): void {
	for (const [key, value] of Object.entries(mock.headers)) {
		res.setHeader(key, value);
	}

	res.statusCode = mock.status;
	res.end(mock.body);
}

export function createCountAggregatorMockMiddleware(): (
	req: IncomingMessage,
	res: ServerResponse,
	next: () => void,
) => void {
	return (req, res, next) => {
		if (req.method !== "GET" && req.method !== "HEAD") {
			next();
			return;
		}

		const requestUrl = req.url ?? "/";
		const mock = resolveCountAggregatorMockRequest(requestUrl);

		if (mock === null) {
			next();
			return;
		}

		if (req.method === "HEAD") {
			res.statusCode = mock.status;
			for (const [key, value] of Object.entries(mock.headers)) {
				res.setHeader(key, value);
			}
			res.end();
			return;
		}

		writeMockHttpResponse(res, mock);
	};
}
