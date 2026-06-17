import {mkdir, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {copyTrafficStyleAssets} from "./copy-assets.ts";

describe("copyTrafficStyleAssets", () => {
	let tmpDir: string;
	let srcDir: string;
	let destDir: string;
	let metaPath: string;

	beforeEach(async () => {
		tmpDir = path.join(
			os.tmpdir(),
			`traffic-copy-assets-${Math.random().toString(36).slice(2)}`,
		);
		srcDir = path.join(tmpDir, "src");
		destDir = path.join(tmpDir, "dest");
		metaPath = path.join(tmpDir, "meta.json");

		await mkdir(path.join(srcDir, "mapsight-icons"), {recursive: true});
		await mkdir(path.join(srcDir, "mapsight-icons-2x"), {recursive: true});
		await mkdir(path.join(srcDir, "mapsight-icons-svg"), {recursive: true});
		await mkdir(path.join(srcDir, "other"), {recursive: true});
		await writeFile(
			metaPath,
			JSON.stringify({
				icons: {
					museum: {groups: ["poi"], render: "composable"},
					traffic: {groups: ["traffic"], render: "sprite"},
				},
			}),
			"utf8",
		);
		await writeFile(
			path.join(srcDir, "mapsight-icons", "museum-default.png"),
			"composable",
			"utf8",
		);
		await writeFile(
			path.join(srcDir, "mapsight-icons-2x", "museum-default.png"),
			"composable-2x",
			"utf8",
		);
		await writeFile(
			path.join(srcDir, "mapsight-icons-svg", "museum-default.svg"),
			"composable-svg",
			"utf8",
		);
		await writeFile(
			path.join(srcDir, "mapsight-icons", "traffic-default.png"),
			"sprite",
			"utf8",
		);
		await writeFile(
			path.join(srcDir, "mapsight-icons", "traffic-small.png"),
			"sprite-small",
			"utf8",
		);
		await writeFile(
			path.join(srcDir, "mapsight-icons-2x", "traffic-default.png"),
			"sprite-2x",
			"utf8",
		);
		await writeFile(
			path.join(srcDir, "mapsight-icons-svg", "traffic-default.svg"),
			"sprite-svg",
			"utf8",
		);
		await writeFile(
			path.join(srcDir, "other", "museum-default.png"),
			"not-catalog",
			"utf8",
		);
	});

	afterEach(async () => {
		await rm(tmpDir, {recursive: true, force: true});
	});

	it("copies all assets by default", async () => {
		const result = await copyTrafficStyleAssets({
			src: srcDir,
			dest: destDir,
			metaPath,
		});

		expect(result).toEqual({copied: 8, skipped: 0});
		await expect(
			readFile(
				path.join(destDir, "mapsight-icons", "museum-default.png"),
				"utf8",
			),
		).resolves.toBe("composable");
	});

	it("skips pre-baked composable icon assets when requested", async () => {
		await mkdir(path.join(destDir, "mapsight-icons"), {recursive: true});
		await writeFile(
			path.join(destDir, "mapsight-icons", "museum-default.png"),
			"stale-composable",
			"utf8",
		);

		const result = await copyTrafficStyleAssets({
			src: srcDir,
			dest: destDir,
			metaPath,
			withoutComposableIcons: true,
		});

		expect(result).toEqual({copied: 5, skipped: 3});
		await expect(
			readFile(
				path.join(destDir, "mapsight-icons", "traffic-default.png"),
				"utf8",
			),
		).resolves.toBe("sprite");
		await expect(
			readFile(path.join(destDir, "other", "museum-default.png"), "utf8"),
		).resolves.toBe("not-catalog");
		await expect(
			readFile(
				path.join(destDir, "mapsight-icons", "museum-default.png"),
				"utf8",
			),
		).resolves.toBe("stale-composable");
	});

	it("preserves unrelated files already in the destination", async () => {
		await mkdir(path.join(destDir, "mapsight-ui"), {recursive: true});
		await writeFile(
			path.join(destDir, "mapsight-ui", "zoom-in.svg"),
			"ui",
			"utf8",
		);

		await copyTrafficStyleAssets({
			src: srcDir,
			dest: destDir,
			metaPath,
			withoutComposableIcons: true,
		});

		await expect(
			readFile(path.join(destDir, "mapsight-ui", "zoom-in.svg"), "utf8"),
		).resolves.toBe("ui");
	});

	it("filters catalog icon assets by group, variant, file type, and resolution", async () => {
		const result = await copyTrafficStyleAssets({
			src: srcDir,
			dest: destDir,
			metaPath,
			groups: ["traffic"],
			variants: ["default"],
			filetypes: ["png"],
			resolutions: ["2x"],
		});

		expect(result).toEqual({copied: 2, skipped: 6});
		await expect(
			readFile(
				path.join(destDir, "mapsight-icons-2x", "traffic-default.png"),
				"utf8",
			),
		).resolves.toBe("sprite-2x");
		await expect(
			readFile(path.join(destDir, "other", "museum-default.png"), "utf8"),
		).resolves.toBe("not-catalog");
		await expect(
			readFile(
				path.join(destDir, "mapsight-icons", "traffic-default.png"),
				"utf8",
			),
		).rejects.toThrow();
		await expect(
			readFile(
				path.join(destDir, "mapsight-icons-svg", "traffic-default.svg"),
				"utf8",
			),
		).rejects.toThrow();
	});
});
