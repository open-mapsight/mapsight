import {execFileSync} from "node:child_process";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const input = path.join(packageRoot, "openapi/count-aggregator.openapi.json");
const output = path.join(packageRoot, "src/generated/client.ts");
mkdirSync(path.dirname(output), {recursive: true});
const cli = path.join(packageRoot, "node_modules/.bin/openapi-zod-client");

execFileSync(
	cli,
	[
		input,
		"-o",
		output,
		"--export-schemas",
		"--export-types",
		"--strict-objects",
		"--with-docs",
		"--api-client-name",
		"countAggregatorApi",
	],
	{stdio: "inherit"},
);

let generated = readFileSync(output, "utf8");
generated = generated.replace(
	/^import \{ z \} from "zod";\n/m,
	'import { z } from "zod";\nimport { createLenientStationTypeListResponseSchema } from "../lib/lenient-station-type-list.js";\n',
);
generated = generated.replace(
	/z\.record\((?!z\.string\(\), )/g,
	"z.record(z.string(), ",
);
generated = generated.replace(
	/const StationTypeListResponse: z\.ZodType<StationTypeListResponse> = z\n  \.object\(\{ data: z\.array\(StationTypeSummary\) \}\)\n  \.strict\(\)\n  \.passthrough\(\);/,
	"const StationTypeListResponse: z.ZodType<StationTypeListResponse> =\n  createLenientStationTypeListResponseSchema(StationTypeSummary);",
);
generated = generated.replaceAll(
	'alias: "count-aggregator.public.",',
	'alias: "count-aggregator.public.park-and-ride.export",',
);
generated = generated.replace(
	/^import \{ makeApi, Zodios(?:, type ZodiosOptions)? \} from "@zodios\/core";\n/m,
	"",
);
generated = generated.replace(
	/^const endpoints = makeApi\(\[/m,
	"export const endpoints = [",
);
generated = generated.replace(
	/\]\);\n\nexport const countAggregatorApi = new Zodios\(endpoints\);\n\nexport function createApiClient[\s\S]*$/,
	"] as const;\n",
);
generated = generated.replaceAll(
	'name: "metrics",\n        type: "Query",\n        schema: z.enum(["sum", "mean", "min", "max", "last"]).optional(),',
	'name: "metrics",\n        type: "Query",\n        schema: z.string().optional(),',
);
writeFileSync(output, generated);
