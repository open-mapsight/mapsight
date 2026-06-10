#!/usr/bin/env node
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

interface PackageJson {
	[key: string]: unknown;
	scripts?: Record<string, string>;
	devDependencies?: Record<string, string>;
	publishConfig?: Record<string, unknown>;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "../..");
const sourcePath = path.join(packageRoot, "package.json");
const destPath = path.join(packageRoot, "dist/package.json");

async function main() {
	const raw = await readFile(sourcePath, "utf8");
	const pkg = JSON.parse(raw) as PackageJson;

	const {scripts, devDependencies, publishConfig, ...distPkg} = pkg;

	if (
		distPkg.imports &&
		typeof distPkg.imports === "object" &&
		!Array.isArray(distPkg.imports)
	) {
		const imports = distPkg.imports as Record<string, string>;
		distPkg.imports = Object.fromEntries(
			Object.entries(imports).map(([key, value]) => [
				key,
				value.replace(/^\.\/dist\//, "./"),
			]),
		);
	}

	await writeFile(
		destPath,
		JSON.stringify(distPkg, null, "\t") + "\n",
		"utf8",
	);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
