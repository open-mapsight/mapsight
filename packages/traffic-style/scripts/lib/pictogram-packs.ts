import {existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

export type PictogramPack = "traffic-style" | "fontawesome";

/** Default for package publish builds and runtime — traffic-style only. */
export const DEFAULT_COMPOSABLE_PACKS: PictogramPack[] = ["traffic-style"];

export function parsePictogramPacks(
	value: string | undefined,
): PictogramPack[] | undefined {
	if (!value) {
		return undefined;
	}

	const packs = value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean) as PictogramPack[];

	return packs.length > 0 ? packs : undefined;
}

export function pictogramPackForIconId(iconId: string): PictogramPack {
	return iconId.startsWith("fa-") ? "fontawesome" : "traffic-style";
}

export async function ensurePictogramPacks(
	packs: readonly PictogramPack[],
): Promise<void> {
	const scriptDir = path.dirname(fileURLToPath(import.meta.url));
	const packageRoot = path.resolve(scriptDir, "../..");
	const libRoot = existsSync(path.join(packageRoot, "lib"))
		? path.join(packageRoot, "lib")
		: path.join(packageRoot, "dist/lib");

	const imports: Promise<unknown>[] = [];

	if (packs.includes("traffic-style")) {
		imports.push(
			import(
				pathToFileURL(path.join(libRoot, "pictograms/index.js")).href
			),
		);
	}

	if (packs.includes("fontawesome")) {
		imports.push(
			import(
				pathToFileURL(path.join(libRoot, "pictograms/fontawesome.js"))
					.href
			),
		);
	}

	await Promise.all(imports);
}
