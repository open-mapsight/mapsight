import fs from "node:fs/promises";
import path from "node:path";

import type {HostEmbedConfig} from "./types.ts";

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
		await fs.rename(path.join(assetsDir, hashedStylesheet), stablePath);
	}

	for (const extra of cssFiles) {
		if (extra !== hashedStylesheet && extra !== config.appStylesheet) {
			await fs.rm(path.join(assetsDir, extra), {force: true});
		}
	}
}
