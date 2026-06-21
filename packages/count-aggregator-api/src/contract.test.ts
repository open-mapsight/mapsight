import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {describe, expect, it} from "vitest";

import {schemas} from "./generated/client.js";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const openApiDocument = JSON.parse(
	readFileSync(
		path.join(packageRoot, "openapi/count-aggregator.openapi.json"),
		"utf8",
	),
) as {
	paths: Record<string, unknown>;
	servers?: unknown;
	components: {
		schemas: Record<
			string,
			{
				example?: unknown;
			}
		>;
	};
};

const schemaByName = schemas as Record<
	string,
	{parse: (value: unknown) => unknown}
>;

describe("OpenAPI contract examples", () => {
	for (const [schemaName, schemaDefinition] of Object.entries(
		openApiDocument.components.schemas,
	)) {
		const example = schemaDefinition.example;
		if (example === undefined) {
			continue;
		}

		const zodSchema = schemaByName[schemaName];
		if (zodSchema === undefined) {
			continue;
		}

		it(`validates ${schemaName} example`, () => {
			expect(() => zodSchema.parse(example)).not.toThrow();
		});
	}
});

describe("OpenAPI contract shape", () => {
	it("does not pin customer deployment URLs", () => {
		const serialized = JSON.stringify(openApiDocument);
		expect(serialized).not.toMatch(/mapsight\.de/i);
		expect(openApiDocument.servers).toBeUndefined();
	});

	it("does not include upstream vendor-specific descriptions", () => {
		const serialized = JSON.stringify(openApiDocument);
		expect(serialized).not.toMatch(/niotix/i);
	});

	it("does not define legacy wheel-counter alias routes", () => {
		const paths = Object.keys(openApiDocument.paths);
		expect(paths.some((route) => route.startsWith("/wheel-counter"))).toBe(
			false,
		);
	});

	it("uses stationIds query parameter for multi-station values", () => {
		const operation = (
			openApiDocument.paths["/{type}/values/{from}/{to}/{resolution}"] as
				| {get?: {parameters?: Array<{name: string}>}}
				| undefined
		)?.get;

		const parameterNames =
			operation?.parameters?.map((parameter) => parameter.name) ?? [];
		expect(parameterNames).toContain("stationIds");
		expect(parameterNames).toContain("metrics");
		expect(parameterNames).not.toContain("originIds");
	});

	it("documents datetime query values route", () => {
		const operation = (
			openApiDocument.paths["/{type}/values"] as
				| {get?: {parameters?: Array<{name: string}>}}
				| undefined
		)?.get;

		const parameterNames =
			operation?.parameters?.map((parameter) => parameter.name) ?? [];
		expect(parameterNames).toEqual(
			expect.arrayContaining([
				"stationIds",
				"from",
				"to",
				"resolution",
				"metrics",
			]),
		);
	});

	it("uses stationId path parameter for single-station routes", () => {
		const operation = (
			openApiDocument.paths["/{type}/{stationId}/sums"] as
				| {get?: {parameters?: Array<{name: string; in?: string}>}}
				| undefined
		)?.get;

		const pathParams =
			operation?.parameters
				?.filter((parameter) => parameter.in === "path")
				.map((parameter) => parameter.name) ?? [];
		expect(pathParams).toContain("stationId");
		expect(pathParams).not.toContain("originId");
	});

	it("parses multi-station response entries keyed by MSP id strings", () => {
		expect(() =>
			schemas.TimeSeriesResponse.parse({
				id: 150,
				fromDateTime: "2026-06-08 00:00:00",
				toDateTime: "2026-06-10 23:59:59",
				lastDateTime: "2026-06-10 23:59:59",
				resolution: "daily",
				stationId: "138969",
				values: [{datetime: "2026-06-08 00:00:00", value: 3081}],
			}),
		).not.toThrow();
	});
});
