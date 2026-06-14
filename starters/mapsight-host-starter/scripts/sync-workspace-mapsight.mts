import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const appRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const repoSyncScript = path.resolve(
	appRoot,
	"../../scripts/sync-workspace-mapsight.mts",
);

if (!fs.existsSync(repoSyncScript)) {
	// No-op when copied outside a Mapsight monorepo checkout.
} else {
	const result = spawnSync(process.execPath, [repoSyncScript, appRoot], {
		stdio: "inherit",
	});

	if (result.status !== 0) {
		throw new Error(
			`sync-workspace-mapsight failed with exit code ${result.status ?? "unknown"}`,
		);
	}
}
