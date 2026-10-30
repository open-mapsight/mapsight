import {createHash} from "node:crypto";
import {readFile, readdir} from "node:fs/promises";
import {resolve} from "node:path";

const directory = resolve(import.meta.dirname, "../src/brand");

/** Build provenance for both official web surfaces; no local paths or timestamps. */
export async function webBrandManifest() {
	const files = [
		"site-header.css",
		"fonts.css",
		"tokens.css",
		"horizontal-ink.svg",
		"horizontal-paper.svg",
		"favicon.svg",
		"LICENSE-tokens.txt",
		...(await readdir(resolve(directory, "fonts"))).map(
			(name) => `fonts/${name}`,
		),
	].sort();
	return {
		source: "open-mapsight/mapsight/apps/showcase/src/brand",
		files: Object.fromEntries(
			await Promise.all(
				files.map(async (name): Promise<[string, string]> => [
					name,
					createHash("sha256")
						.update(await readFile(resolve(directory, name)))
						.digest("hex"),
				]),
			),
		),
	};
}
