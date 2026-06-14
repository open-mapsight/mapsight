import fs from "node:fs/promises";
import path from "node:path";

export function rewriteCssUrlPaths(css: string, assetBasePath: string): string {
	return css.replaceAll("url(/img/", `url(${assetBasePath}/img/`);
}

export async function rewriteAbsoluteAssetPaths(
	targetDir: string,
	assetBasePath: string,
): Promise<void> {
	const entries = await fs.readdir(targetDir, {withFileTypes: true});

	for (const entry of entries) {
		const entryPath = path.join(targetDir, entry.name);

		if (entry.isDirectory()) {
			await rewriteAbsoluteAssetPaths(entryPath, assetBasePath);
			continue;
		}

		if (!entry.name.endsWith(".css")) {
			continue;
		}

		const css = await fs.readFile(entryPath, "utf8");
		const rewritten = rewriteCssUrlPaths(css, assetBasePath);

		if (rewritten !== css) {
			await fs.writeFile(entryPath, rewritten, "utf8");
		}
	}
}
