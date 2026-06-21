import {writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const output = path.join(packageRoot, "openapi/count-aggregator.openapi.json");
const liveUrl = process.env.COUNT_AGGREGATOR_OPENAPI_URL;

if (!liveUrl) {
	throw new Error(
		"Set COUNT_AGGREGATOR_OPENAPI_URL before syncing (see .env.example).",
	);
}

type OpenApiParameter = {
	name?: string;
	in?: string;
	schema?: Record<string, unknown>;
};

type OpenApiOperation = {
	operationId?: string;
	parameters?: OpenApiParameter[];
};

type OpenApiSchema = {
	properties?: Record<string, {type?: string | string[]}>;
	required?: string[];
	example?: unknown;
	additionalProperties?: unknown;
};

const response = await fetch(liveUrl);
if (!response.ok) {
	throw new Error(`Failed to fetch live OpenAPI: HTTP ${response.status}`);
}

const spec = (await response.json()) as {
	paths: Record<string, Record<string, OpenApiOperation>>;
	info?: {description?: string};
	servers?: unknown;
	components?: {
		schemas?: Record<string, OpenApiSchema>;
	};
};

spec.paths = Object.fromEntries(
	Object.entries(spec.paths).filter(
		([route]) => !route.startsWith("/wheel-counter"),
	),
);

for (const methods of Object.values(spec.paths)) {
	for (const operation of Object.values(methods)) {
		for (const parameter of operation.parameters ?? []) {
			if (parameter.name !== "metrics") {
				continue;
			}

			parameter.schema = {
				type: "string",
				description:
					"Comma-separated bucket statistics to return per timestamp. Allowed values: sum, mean, min, max, last.",
				example: "mean,min,max",
			};
		}
	}
}

const schemas = spec.components?.schemas;
const stationTypeSummary = schemas?.StationTypeSummary;
if (stationTypeSummary?.properties?.station_count?.type === "string") {
	stationTypeSummary.properties.station_count.type = "integer";
}

const stationMetric = schemas?.StationMetric;
if (stationMetric?.properties !== undefined) {
	stationMetric.properties.unit = {type: ["string", "null"]};
	stationMetric.properties.displayPrecision = {type: "integer"};
	stationMetric.properties.defaultMetric = {
		type: "string",
		enum: ["sum", "mean", "min", "max", "last"],
	};
	stationMetric.properties.aggregation = {
		type: "array",
		items: {
			type: "string",
			enum: ["sum", "mean", "min", "max", "last"],
		},
	};
}

const dataValuePoint = schemas?.DataValuePoint;
if (dataValuePoint !== undefined) {
	delete dataValuePoint.additionalProperties;
	dataValuePoint.required = ["datetime"];
}

const geoJsonProperties = schemas?.StationGeoJsonFeatureProperties;
if (geoJsonProperties?.required !== undefined) {
	geoJsonProperties.required = [
		"id",
		"originId",
		"name",
		"type",
		"typeLabel",
		"tags",
		"hasData",
		"countAggregatorType",
		"countAggregatorStationId",
		"tagGroups",
		"lastDataAt",
		"mapsightIconId",
	];
}

const stationTypeCategory = schemas?.StationTypeCategory;
if (
	stationTypeCategory !== undefined &&
	stationTypeCategory.example === undefined
) {
	stationTypeCategory.example = {
		id: "weather",
		label: "Wetter",
	};
}

if (
	typeof spec.paths["/park-and-ride/export"] === "object" &&
	spec.paths["/park-and-ride/export"] !== null
) {
	const operation = spec.paths["/park-and-ride/export"].get;
	if (operation !== undefined) {
		operation.operationId = "count-aggregator.public.park-and-ride.export";
	}
}

delete spec.servers;

const description = spec.info?.description ?? "";
if (!description.includes("Monorepo client contract excludes")) {
	spec.info ??= {};
	spec.info.description =
		`${description} Monorepo client contract excludes legacy /wheel-counter/* alias routes.`.trim();
}

const normalizedSpec = JSON.stringify(spec, null, "\t")
	.replace(
		/External origin id from the data source \(e\.g\. [^)]+ twin id\)\./g,
		"External origin id from the upstream data source.",
	)
	.replace(
		/Font Awesome icon identifier \(e\.g\. fa-water\)\. Uses the Niotix `faIcon` metadata when present, otherwise a type-specific fallback icon(?:\. For grouped child stations)?\./g,
		"Font Awesome icon identifier from the upstream data source (e.g. fa-water). Omitted when no icon is configured.",
	)
	.replace(
		/[A-Z][A-Za-z0-9_-]+ station description\. Omitted when not configured\./g,
		"Station description from the upstream data source. Omitted when not configured.",
	);

writeFileSync(output, `${normalizedSpec}\n`);
console.log(`Synced live OpenAPI to ${output}`);
