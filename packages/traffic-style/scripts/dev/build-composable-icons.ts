#!/usr/bin/env node
import path from "node:path";
import {fileURLToPath} from "node:url";
import {parseArgs} from "node:util";

import {main as runComposableIconsCli} from "../traffic-composable-icons.ts";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"..",
);

async function main(): Promise<void> {
	const {values: options, positionals} = parseArgs({
		args: process.argv.slice(2),
		options: {
			scale: {type: "string"},
			dest: {type: "string"},
			format: {type: "string"},
		},
		allowPositionals: true,
	});

	const format = options.format ?? positionals[0];
	const scale = options.scale ?? "1";
	const dest =
		options.dest ??
		path.join(
			packageRoot,
			"dist/img",
			format === "svg"
				? "mapsight-icons-svg"
				: scale === "2"
					? "mapsight-icons-2x"
					: "mapsight-icons",
		);

	await runComposableIconsCli([
		"--meta-path",
		path.join(packageRoot, "src/meta.json"),
		"--dest",
		dest,
		"--scale",
		scale,
		"--pack",
		"traffic-style",
		...(format ? ["--format", format] : []),
	]);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
