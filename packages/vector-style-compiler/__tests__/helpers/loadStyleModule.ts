import {mkdtemp, rm, symlink, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import type Style from "ol/style/Style";

import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

type CompiledStyle = ((
	...args: Parameters<MapsightStyleFunction>
) => Style[]) & {
	allowedProps?: string[] | false;
};

/** Import the unmodified output, including its actual runtime dependencies. */
export async function loadStyleModule(
	program: string,
	// A host directory supplies optional runtime dependencies, such as traffic-style.
	directory = new URL("../../", import.meta.url),
): Promise<CompiledStyle> {
	const folder = await mkdtemp(join(tmpdir(), "mapsight-style-"));
	try {
		await symlink(
			fileURLToPath(new URL("node_modules/", directory)),
			join(folder, "node_modules"),
			"dir",
		);
		const filename = `${folder}/style.mjs`;
		await writeFile(filename, program);
		const module = (await import(pathToFileURL(filename).href)) as {
			default: CompiledStyle;
		};
		return module.default;
	} finally {
		await rm(folder, {recursive: true, force: true});
	}
}
