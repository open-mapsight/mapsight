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

const response = await fetch(liveUrl);
if (!response.ok) {
	throw new Error(`Failed to fetch live OpenAPI: HTTP ${response.status}`);
}

const spec = (await response.json()) as {
	paths: Record<string, unknown>;
	info?: {description?: string};
	servers?: unknown;
};

spec.paths = Object.fromEntries(
	Object.entries(spec.paths).filter(
		([route]) => !route.startsWith("/wheel-counter"),
	),
);

if (
	typeof spec.paths["/park-and-ride/export"] === "object" &&
	spec.paths["/park-and-ride/export"] !== null
) {
	const operation = spec.paths["/park-and-ride/export"] as {
		get?: {operationId?: string};
	};
	if (operation.get !== undefined) {
		operation.get.operationId =
			"count-aggregator.public.park-and-ride.export";
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
		/Font Awesome icon identifier from [^(]+ \(e\.g\. fa-water\)\. Omitted when no icon is configured\./g,
		"Font Awesome icon identifier from the upstream data source (e.g. fa-water). Omitted when no icon is configured.",
	)
	.replace(
		/[A-Z][A-Za-z0-9_-]+ station description\. Omitted when not configured\./g,
		"Station description from the upstream data source. Omitted when not configured.",
	);

writeFileSync(output, `${normalizedSpec}\n`);
console.log(`Synced live OpenAPI to ${output}`);
