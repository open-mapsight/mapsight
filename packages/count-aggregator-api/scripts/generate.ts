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
	/z\.record\((?!z\.string\(\), )/g,
	"z.record(z.string(), ",
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
writeFileSync(output, generated);
