import fs from "node:fs/promises";
import path from "node:path";
import {parseArgs} from "node:util";

import {watch} from "chokidar";
import * as sass from "sass";

import vectorStyleCompiler from "./index.ts";

interface CliOptions {
	output: string;
	name: string;
	include: string[];
	watch: boolean;
}

const debounceAsync = (fn: () => Promise<void>, delay: number) => {
	let timer: NodeJS.Timeout;
	return () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			fn().catch(console.error);
		}, delay);
	};
};

async function compile(input: string, opts: CliOptions) {
	let css: string;
	if (input.endsWith(".scss") || input.endsWith(".sass")) {
		const result = sass.compile(input, {
			loadPaths: [
				"node_modules",
				...opts.include.map((p: string) => path.resolve(p)),
			],
			style: "expanded" as const,
			quietDeps: true,
			silenceDeprecations: ["legacy-js-api"],
			sourceMap: false,
		});
		css = result.css.toString();
	} else {
		css = await fs.readFile(input, "utf8");
	}
	const outDir = path.resolve(opts.output);
	const cssPath = path.join(outDir, `${opts.name}.css`);
	const jsPath = path.join(outDir, `${opts.name}.js`);
	await fs.mkdir(outDir, {recursive: true});
	await fs.writeFile(cssPath, css);
	const js = vectorStyleCompiler(css);
	await fs.writeFile(jsPath, js);
	console.log(`Updated: ${cssPath}, ${jsPath}`);
}

const {values, positionals} = parseArgs({
	options: {
		output: {
			type: "string",
			short: "o",
			default: "tmp/mapsight-vector-styles",
		},
		name: {
			type: "string",
			short: "n",
			default: "default",
		},
		include: {
			type: "string",
			short: "i",
			default: "node_modules",
		},
		watch: {
			type: "boolean",
			default: false,
		},
	},
	allowPositionals: true,
});

const input = positionals[0];

if (!input) {
	throw new Error("input SCSS or CSS file is required");
}

const options: CliOptions = {
	output: values.output,
	name: values.name,
	include: values.include.split(","),
	watch: values.watch,
};

await compile(input, options);

if (options.watch) {
	const debouncedCompile = debounceAsync(() => compile(input, options), 300);
	watch(input).on("change", debouncedCompile);
	console.log(`Watching ${input}...`);
}
