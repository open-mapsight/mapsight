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

delete spec.servers;

const description = spec.info?.description ?? "";
if (!description.includes("Monorepo client contract excludes")) {
	spec.info ??= {};
	spec.info.description =
		`${description} Monorepo client contract excludes legacy /wheel-counter/* alias routes.`.trim();
}

writeFileSync(output, `${JSON.stringify(spec, null, "\t")}\n`);
console.log(`Synced live OpenAPI to ${output}`);
