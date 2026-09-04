import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {describe, expect, it} from "vitest";

import {
	buildTargetsFromMapsightIconId,
	composableIconFileName,
	loadComposableIconTargets,
	resolveIconColors,
} from "./composable-icons.ts";
import {
	PACKAGE_COMPOSABLE_PACKS,
	pictogramPackForIconId,
} from "./pictogram-packs.ts";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../..",
);
const sourceMetaPath = path.join(packageRoot, "src/meta.json");

describe("composable-icons", () => {
	it("builds standard filenames", () => {
		expect(composableIconFileName("museum", "default")).toBe(
			"museum-default.png",
		);
	});

	it("auto-picks foreground when only background is set", () => {
		expect(resolveIconColors({background: "#035799"})).toEqual({
			background: "#035799",
			foreground: "#ffffff",
		});
	});

	it("classifies pictogram packs by icon id", () => {
		expect(pictogramPackForIconId("museum")).toBe("traffic-style");
		expect(pictogramPackForIconId("fa-school")).toBe("fontawesome");
	});

	it("expands a compact mapsightIconId into variant targets", () => {
		const targets = buildTargetsFromMapsightIconId("museum/#be123c", [
			"default",
			"plain",
		]);
		expect(targets).toHaveLength(2);
		expect(targets[0]).toMatchObject({
			iconId: "museum",
			variant: "default",
			colors: {
				background: "#be123c",
				foreground: "#ffffff",
			},
		});
	});

	it("excludes Font Awesome ids from the CLI default pack", async () => {
		const targets = await loadComposableIconTargets(sourceMetaPath, {
			variants: ["plain"],
		});
		const iconIds = new Set(targets.map((target) => target.iconId));

		expect(iconIds.has("museum")).toBe(true);
		expect(iconIds.has("fa-route")).toBe(false);
	});

	it("package catalog packs include every composable meta.json icon", async () => {
		const meta = JSON.parse(await readFile(sourceMetaPath, "utf8")) as {
			icons?: Record<string, {render?: string}>;
		};
		const composableIds = Object.entries(meta.icons ?? {})
			.filter(([, iconMeta]) => iconMeta.render === "composable")
			.map(([iconId]) => iconId)
			.sort();

		const targets = await loadComposableIconTargets(sourceMetaPath, {
			packs: PACKAGE_COMPOSABLE_PACKS,
			variants: ["plain"],
		});
		const iconIds = targets.map((target) => target.iconId).sort();

		expect(PACKAGE_COMPOSABLE_PACKS).toEqual([
			"traffic-style",
			"fontawesome",
		]);
		expect(iconIds).toContain("fa-route");
		expect(iconIds).toEqual(composableIds);
		expect(
			targets.some(
				(target) =>
					target.iconId === "fa-route" && target.variant === "plain",
			),
		).toBe(true);
	});

	it("package composable build script uses PACKAGE_COMPOSABLE_PACKS", async () => {
		const source = await readFile(
			path.join(packageRoot, "scripts/dev/build-composable-icons.ts"),
			"utf8",
		);

		expect(source).toContain("PACKAGE_COMPOSABLE_PACKS");
		expect(source).not.toMatch(/--pack["\s,]+traffic-style["\s]/);
	});
});
