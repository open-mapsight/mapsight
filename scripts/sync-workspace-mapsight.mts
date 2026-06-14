import fs from "node:fs";
import path from "node:path";

const mapsightPackages = [
	"core",
	"ui",
	"lib-js",
	"lib-ol",
	"lib-redux",
	"traffic-style",
] as const;

const mapsightDevPackages = ["vector-style-compiler"] as const;

function copyRecursive(src: string, dest: string): void {
	fs.cpSync(src, dest, {force: true, recursive: true});
}

function findMapsightRepoRoot(startDir: string): string | null {
	let dir = path.resolve(startDir);

	while (true) {
		if (
			fs.existsSync(path.join(dir, "packages")) &&
			fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))
		) {
			return dir;
		}

		const parent = path.dirname(dir);
		if (parent === dir) {
			return null;
		}

		dir = parent;
	}
}

/** Refresh linked @mapsight/* installs for a copy-out app inside the Mapsight monorepo. */
export function syncWorkspaceMapsight(appRoot: string): void {
	const repoRoot = findMapsightRepoRoot(appRoot);
	if (!repoRoot) {
		return;
	}

	const repoPackages = path.join(repoRoot, "packages");

	for (const name of mapsightPackages) {
		syncPackage(appRoot, repoPackages, name);
	}

	for (const name of mapsightDevPackages) {
		syncDevPackage(appRoot, repoPackages, name);
	}
}

function syncPackage(
	appRoot: string,
	repoPackages: string,
	name: (typeof mapsightPackages)[number],
): void {
	const workspacePkg = path.join(repoPackages, name);
	const targetRoot = path.join(appRoot, "node_modules", "@mapsight", name);

	if (!fs.existsSync(workspacePkg) || !fs.existsSync(targetRoot)) {
		return;
	}

	if (name === "traffic-style") {
		const publishRoot = path.join(workspacePkg, "dist");
		if (!fs.existsSync(publishRoot)) {
			return;
		}

		for (const entry of fs.readdirSync(publishRoot)) {
			copyRecursive(
				path.join(publishRoot, entry),
				path.join(targetRoot, entry),
			);
		}

		return;
	}

	const workspaceDist = path.join(workspacePkg, "dist");
	if (fs.existsSync(workspaceDist)) {
		copyRecursive(workspaceDist, path.join(targetRoot, "dist"));
	}

	fs.copyFileSync(
		path.join(workspacePkg, "package.json"),
		path.join(targetRoot, "package.json"),
	);

	if (name === "ui") {
		const workspaceSrc = path.join(workspacePkg, "src");
		if (fs.existsSync(workspaceSrc)) {
			copyRecursive(workspaceSrc, path.join(targetRoot, "src"));
		}
	}
}

function syncDevPackage(
	appRoot: string,
	repoPackages: string,
	name: (typeof mapsightDevPackages)[number],
): void {
	const workspacePkg = path.join(repoPackages, name);
	const targetRoot = path.join(appRoot, "node_modules", "@mapsight", name);

	if (!fs.existsSync(workspacePkg) || !fs.existsSync(targetRoot)) {
		return;
	}

	const workspaceDist = path.join(workspacePkg, "dist");
	if (fs.existsSync(workspaceDist)) {
		copyRecursive(workspaceDist, path.join(targetRoot, "dist"));
	}

	const workspaceBin = path.join(workspacePkg, "bin");
	if (fs.existsSync(workspaceBin)) {
		copyRecursive(workspaceBin, path.join(targetRoot, "bin"));
	}

	fs.copyFileSync(
		path.join(workspacePkg, "package.json"),
		path.join(targetRoot, "package.json"),
	);
}

const appRootArg = process.argv[2];
if (appRootArg) {
	syncWorkspaceMapsight(path.resolve(appRootArg));
}
