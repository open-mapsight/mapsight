import {createHash} from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type {HostEmbedConfig} from "./types.ts";

function digestForAsset(contents: string): string {
	return createHash("sha256")
		.update(contents)
		.digest("base64url")
		.slice(0, 8);
}

function renderEntryWrapper(
	hashedEntry: string,
	options: {defaultExport: boolean},
): string {
	return [
		`export * from ${JSON.stringify(`./${hashedEntry}`)};`,
		...(options.defaultExport
			? [`export {default} from ${JSON.stringify(`./${hashedEntry}`)};`]
			: []),
		"",
	].join("\n");
}

export async function finalizeAppStylesheet(
	assetsDir: string,
	config: HostEmbedConfig,
): Promise<void> {
	const cssFiles = (await fs.readdir(assetsDir)).filter((name) =>
		name.endsWith(".css"),
	);

	if (cssFiles.length === 0) {
		throw new Error("Embed build did not emit an app stylesheet.");
	}

	const prefix = config.appStylesheetPrefix;
	const hashedStylesheet =
		(prefix
			? cssFiles.find((name) => name.startsWith(prefix))
			: undefined) ?? cssFiles[0]!;
	const stablePath = path.join(assetsDir, config.appStylesheet);

	if (hashedStylesheet !== config.appStylesheet) {
		await fs.rm(stablePath, {force: true});
		await fs.writeFile(
			stablePath,
			`@import ${JSON.stringify(`./${hashedStylesheet}`)};\n`,
			"utf8",
		);
	}

	for (const extra of cssFiles) {
		if (extra !== hashedStylesheet && extra !== config.appStylesheet) {
			await fs.rm(path.join(assetsDir, extra), {force: true});
		}
	}
}

export async function finalizeEntryModules(
	assetsDir: string,
	config: HostEmbedConfig,
): Promise<void> {
	const entryNames = [
		config.runtimeEntry,
		...Object.keys(config.embedTypeEntries),
	];
	const defaultEntryExports = new Set(
		config.defaultEntryExports ?? [config.runtimeEntry],
	);

	for (const entryName of entryNames) {
		const stableEntry = `${entryName}.js`;
		const stablePath = path.join(assetsDir, stableEntry);
		const contents = await fs.readFile(stablePath, "utf8");
		const hashedEntry = `${entryName}-${digestForAsset(contents)}.js`;

		await fs.rm(path.join(assetsDir, hashedEntry), {force: true});
		await fs.rename(stablePath, path.join(assetsDir, hashedEntry));
		await fs.writeFile(
			stablePath,
			renderEntryWrapper(hashedEntry, {
				defaultExport: defaultEntryExports.has(entryName),
			}),
			"utf8",
		);
	}
}
